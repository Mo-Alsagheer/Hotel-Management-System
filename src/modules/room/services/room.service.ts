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
import { FacilityService } from '../../facility/facility.service';
import { CreateRoomDto } from '../dtos/create-room.dto';
import { UpdateRoomDto } from '../dtos/update-room.dto';
import { RoomQueryDto } from '../dtos/room-query.dto';
import { PaginatedResponse } from '../../../common/interfaces/paginated-response.interface';
import { RoomImageService } from './room-image.service';
import {
  Booking,
  BookingDocument,
  BookingStatus,
} from '../../booking/schemas/booking.schema';
import { Review, ReviewDocument } from '../../review/schemas/review.schema';
import { IRoomService } from '../interfaces/room-service.interface';

@Injectable()
export class RoomService implements IRoomService {
  constructor(
    @InjectModel(Room.name) private readonly roomModel: Model<RoomDocument>,
    @InjectModel(Booking.name)
    private readonly bookingModel: Model<BookingDocument>,
    @InjectModel(Review.name)
    private readonly reviewModel: Model<ReviewDocument>,
    private readonly facilityService: FacilityService,
    private readonly roomImageService: RoomImageService,
  ) {}

  async create(
    createRoomDto: CreateRoomDto,
    imagePaths: string[] = [],
  ): Promise<Room> {
    // 1. Verify facilities exist
    if (createRoomDto.facilities && createRoomDto.facilities.length > 0) {
      try {
        await this.facilityService.validateFacilitiesExist(
          createRoomDto.facilities,
        );
      } catch (error) {
        // Clean up uploaded files if validation fails
        this.roomImageService.cleanupFiles(imagePaths);
        throw error;
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
      const occupiedRoomIds = await this.getOccupiedRoomIds(checkIn, checkOut);
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
      reviews: Array<{
        id: Types.ObjectId;
        rating: number;
        comment?: string;
        userName: string;
      }>;
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

    // Fetch and format reviews
    const formattedReviews = await this.getRoomReviews(
      new Types.ObjectId(room._id),
    );

    return {
      ...room,
      reviews: formattedReviews,
    };
  }

  async exists(id: string): Promise<boolean> {
    if (!Types.ObjectId.isValid(id)) return false;
    const doc = await this.roomModel
      .exists({ _id: id, isDeleted: false })
      .exec();
    return !!doc;
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
      try {
        await this.facilityService.validateFacilitiesExist(
          updateRoomDto.facilities,
        );
      } catch (error) {
        this.roomImageService.cleanupFiles(newImagePaths);
        throw error;
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
    await this.validateRoomDeletion(id);

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

  // --- Availability Logic (Consolidated) ---

  async getOccupiedRoomIds(
    checkIn: Date,
    checkOut: Date,
  ): Promise<Types.ObjectId[]> {
    if (checkIn >= checkOut) {
      throw new BadRequestException(
        'checkIn date must be before checkOut date',
      );
    }
    const overlappingBookings = await this.bookingModel
      .find({
        status: { $ne: BookingStatus.CANCELLED },
        $or: [{ checkIn: { $lt: checkOut }, checkOut: { $gt: checkIn } }],
      })
      .select('roomId')
      .lean()
      .exec();

    return overlappingBookings.map((b) => new Types.ObjectId(b.roomId));
  }

  async validateRoomDeletion(roomId: string): Promise<void> {
    const activeBooking = await this.bookingModel
      .findOne({
        roomId: new Types.ObjectId(roomId),
        status: { $in: [BookingStatus.PENDING, BookingStatus.CONFIRMED] },
        checkOut: { $gte: new Date() },
      })
      .lean()
      .exec();

    if (activeBooking) {
      throw new BadRequestException(
        'Cannot delete room with active/upcoming bookings',
      );
    }
  }

  // --- Ratings & Reviews Logic (Consolidated & Optimized) ---

  async getRoomReviews(roomId: Types.ObjectId): Promise<
    Array<{
      id: Types.ObjectId;
      rating: number;
      comment?: string;
      userName: string;
    }>
  > {
    const reviews = await this.reviewModel
      .find({ roomId })
      .populate<{ userId: { name?: string } }>('userId', 'name')
      .lean()
      .exec();

    return reviews.map((r) => ({
      id: r._id,
      rating: r.rating,
      comment: r.comment,
      userName: r.userId?.name || 'Anonymous',
    }));
  }

  async updateAverageRating(roomId: string): Promise<void> {
    const stats = (await this.reviewModel
      .aggregate([
        { $match: { roomId: new Types.ObjectId(roomId) } },
        {
          $group: {
            _id: '$roomId',
            avgRating: { $avg: '$rating' },
          },
        },
      ])
      .exec()) as unknown as Array<{ _id: Types.ObjectId; avgRating: number }>;

    const averageRating =
      stats.length > 0 ? parseFloat(stats[0].avgRating.toFixed(2)) : 0;

    await this.roomModel
      .updateOne({ _id: roomId }, { $set: { averageRating } })
      .exec();
  }
}
