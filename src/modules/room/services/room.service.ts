import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import type { QueryFilter } from 'mongoose';
import { Room, RoomDocument } from '../schemas/room.schema';
import { FacilityService } from '../../facility/interfaces/facility-service.interface';
import { CreateRoomDto } from '../dtos/create-room.dto';
import { UpdateRoomDto } from '../dtos/update-room.dto';
import { RoomQueryDto } from '../dtos/room-query.dto';
import { PaginatedResponse } from '../../../common/interfaces/paginated-response.interface';
import { RoomService } from '../interfaces/room-service.interface';
import { RoomAvailabilityService } from '../interfaces/room-availability-service.interface';
import { RoomImageService } from '../interfaces/room-image-service.interface';
import { RoomRatingService } from '../interfaces/room-rating-service.interface';

@Injectable()
export class MongooseRoomService extends RoomService {
  constructor(
    @InjectModel(Room.name) private readonly roomModel: Model<RoomDocument>,
    private readonly facilityService: FacilityService,
    private readonly roomAvailabilityService: RoomAvailabilityService,
    private readonly roomImageService: RoomImageService,
    private readonly roomRatingService: RoomRatingService,
  ) {
    super();
  }

  async create(
    createRoomDto: CreateRoomDto,
    imagePaths: string[] = [],
  ): Promise<Room> {
    // 1. Verify facilities exist
    if (createRoomDto.facilities && createRoomDto.facilities.length > 0) {
      const allExist = await this.facilityService.validateFacilitiesExist(
        createRoomDto.facilities,
      );
      if (!allExist) {
        // Clean up uploaded files if validation fails
        this.roomImageService.cleanupFiles(imagePaths);
        throw new BadRequestException('One or more facility IDs are invalid');
      }
    }

    try {
      const roomData = {
        ...createRoomDto,
        images: imagePaths,
      };

      const createdRoom = new this.roomModel(roomData);
      return await createdRoom.save();
    } catch (error) {
      // Clean up uploaded files if save fails
      this.roomImageService.cleanupFiles(imagePaths);
      if ((error as { code?: number }).code === 11000) {
        throw new ConflictException(
          `Room with number "${createRoomDto.roomNumber}" already exists`,
        );
      }
      throw error;
    }
  }

  async findAll(dto: RoomQueryDto): Promise<PaginatedResponse<Room>> {
    const { page = 1, limit = 10, search, checkIn, checkOut, capacity } = dto;
    const query: QueryFilter<Room> = { isDeleted: false };

    if (search) {
      query.$or = [
        { roomNumber: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
      ];
    }

    if (capacity) {
      query.capacity = { $gte: capacity };
    }

    if (checkIn && checkOut) {
      const occupiedRoomIds =
        await this.roomAvailabilityService.getOccupiedRoomIds(
          checkIn,
          checkOut,
        );
      query._id = { $nin: occupiedRoomIds };
    }

    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      this.roomModel
        .find(query)
        .populate('facilities')
        .skip(skip)
        .limit(limit)
        .lean()
        .exec(),
      this.roomModel.countDocuments(query).exec(),
    ]);

    const totalPages = Math.ceil(total / limit);

    return {
      data: data,
      total,
      page,
      limit,
      totalPages,
    };
  }

  async findOne(id: string): Promise<
    Room & {
      reviews: {
        id: Types.ObjectId;
        rating: number;
        comment?: string;
        userName: string;
      }[];
    }
  > {
    const room = await this.roomModel
      .findById(id)
      .populate('facilities')
      .lean()
      .exec();
    if (!room || room.isDeleted) {
      throw new NotFoundException(`Room with ID "${id}" not found`);
    }

    // Fetch and format reviews via RoomRatingService
    const formattedReviews = await this.roomRatingService.getRoomReviews(
      new Types.ObjectId(room._id),
    );

    return {
      ...room,
      reviews: formattedReviews,
    };
  }

  async update(
    id: string,
    updateRoomDto: UpdateRoomDto,
    newImagePaths: string[] = [],
  ): Promise<Room> {
    const room = await this.roomModel.findById(id).exec();
    if (!room || room.isDeleted) {
      this.roomImageService.cleanupFiles(newImagePaths);
      throw new NotFoundException(`Room with ID "${id}" not found`);
    }

    if (updateRoomDto.facilities && updateRoomDto.facilities.length > 0) {
      const allExist = await this.facilityService.validateFacilitiesExist(
        updateRoomDto.facilities,
      );
      if (!allExist) {
        this.roomImageService.cleanupFiles(newImagePaths);
        throw new BadRequestException('One or more facility IDs are invalid');
      }
    }

    try {
      const updatedImages = [...(room.images || []), ...newImagePaths];
      const updateData = {
        ...updateRoomDto,
        images: updatedImages,
      };

      const updatedRoom = await this.roomModel
        .findByIdAndUpdate(id, updateData, { new: true, runValidators: true })
        .exec();

      if (!updatedRoom) {
        throw new NotFoundException(`Room with ID "${id}" not found`);
      }
      return updatedRoom;
    } catch (error) {
      this.roomImageService.cleanupFiles(newImagePaths);
      if ((error as { code?: number }).code === 11000) {
        throw new ConflictException(
          `Room with number "${updateRoomDto.roomNumber}" already exists`,
        );
      }
      throw error;
    }
  }

  async delete(id: string): Promise<{ message: string }> {
    const room = await this.roomModel.findById(id).exec();
    if (!room || room.isDeleted) {
      throw new NotFoundException(`Room with ID "${id}" not found`);
    }

    // Check if there are active/future bookings before soft deleting
    await this.roomAvailabilityService.validateRoomDeletion(id);

    room.isDeleted = true;
    await room.save();

    return { message: 'Room soft-deleted successfully' };
  }

  async removeImage(
    id: string,
    imageName: string,
  ): Promise<{ message: string }> {
    const room = await this.roomModel.findById(id).exec();
    if (!room || room.isDeleted) {
      throw new NotFoundException(`Room with ID "${id}" not found`);
    }

    const imagePath = `/uploads/rooms/${imageName}`;
    const images = room.images || [];
    const imageIndex = images.indexOf(imagePath);
    if (imageIndex === -1) {
      throw new NotFoundException(
        `Image "${imageName}" not found in this room`,
      );
    }

    // Remove from array and save
    images.splice(imageIndex, 1);
    room.images = images;
    await room.save();

    // Clean up from filesystem
    this.roomImageService.deleteImageFile(imagePath);

    return { message: 'Room image deleted successfully' };
  }
}
