import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import type { QueryFilter, UpdateQuery } from 'mongoose';
import { Room, RoomDocument } from './schemas/room.schema';
import {
  Booking,
  BookingDocument,
  BookingStatus,
} from '../booking/schemas/booking.schema';
import { Review, ReviewDocument } from '../review/schemas/review.schema';
import { FacilityService } from '../facility/facility.service';
import { CreateRoomDto } from './dtos/create-room.dto';
import { UpdateRoomDto } from './dtos/update-room.dto';
import { PaginatedResponse } from '../../common/interfaces/paginated-response.interface';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class RoomService {
  constructor(
    @InjectModel(Room.name) private roomModel: Model<RoomDocument>,
    @InjectModel(Booking.name) private bookingModel: Model<BookingDocument>,
    @InjectModel(Review.name) private reviewModel: Model<ReviewDocument>,
    private readonly facilityService: FacilityService,
  ) {}

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
        this.cleanupFiles(imagePaths);
        throw new BadRequestException('One or more facility IDs do not exist');
      }
    }

    try {
      const roomData = {
        ...createRoomDto,
        facilities:
          createRoomDto.facilities?.map((id) => new Types.ObjectId(id)) || [],
        images: imagePaths,
      };

      const createdRoom = new this.roomModel(roomData);
      return await createdRoom.save();
    } catch (error) {
      // Clean up uploaded files if save fails
      this.cleanupFiles(imagePaths);
      if ((error as { code?: number }).code === 11000) {
        throw new ConflictException(
          `Room with number "${createRoomDto.roomNumber}" already exists`,
        );
      }
      throw error;
    }
  }

  async findAllAdmin(
    page = 1,
    limit = 10,
    search?: string,
  ): Promise<PaginatedResponse<Room>> {
    const query: QueryFilter<Room> = { isDeleted: false };

    if (search) {
      query.$or = [
        { roomNumber: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
      ];
    }

    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      this.roomModel
        .find(query)
        .populate('facilities')
        .skip(skip)
        .limit(limit)
        .exec(),
      this.roomModel.countDocuments(query).exec(),
    ]);

    const totalPages = Math.ceil(total / limit);

    return {
      data,
      total,
      page,
      limit,
      totalPages,
    };
  }

  async findAllPublic(
    page = 1,
    limit = 10,
    checkIn?: Date,
    checkOut?: Date,
    capacity?: number,
  ): Promise<PaginatedResponse<Room>> {
    const query: QueryFilter<Room> = { isDeleted: false };

    // Capacity filter: must be at least requested capacity
    if (capacity) {
      query.capacity = { $gte: capacity };
    }

    // Availability filter: exclude rooms with overlapping bookings
    if (checkIn && checkOut) {
      if (checkIn >= checkOut) {
        throw new BadRequestException(
          'checkIn date must be before checkOut date',
        );
      }

      // Find overlapping bookings
      const overlappingBookings = await this.bookingModel
        .find({
          status: { $ne: BookingStatus.CANCELLED },
          $or: [
            // Request range overlaps with existing range
            { checkIn: { $lt: checkOut }, checkOut: { $gt: checkIn } },
          ],
        })
        .select('roomId')
        .exec();

      const occupiedRoomIds = overlappingBookings.map((b) => b.roomId);
      query._id = { $nin: occupiedRoomIds };
    }

    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      this.roomModel
        .find(query)
        .populate('facilities')
        .skip(skip)
        .limit(limit)
        .exec(),
      this.roomModel.countDocuments(query).exec(),
    ]);

    const totalPages = Math.ceil(total / limit);

    return {
      data,
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
      .exec();
    if (!room || room.isDeleted) {
      throw new NotFoundException(`Room with ID "${id}" not found`);
    }

    // Fetch and format reviews with user's name
    const reviews = await this.reviewModel
      .find({ roomId: room._id })
      .populate('userId', 'name')
      .exec();

    const formattedReviews = reviews.map((r) => ({
      id: r._id,
      rating: r.rating,
      comment: r.comment,
      userName: (r.userId as { name?: string } | null)?.name || 'Anonymous',
    }));

    return {
      ...room.toObject(),
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
      this.cleanupFiles(newImagePaths);
      throw new NotFoundException(`Room with ID "${id}" not found`);
    }

    if (updateRoomDto.facilities && updateRoomDto.facilities.length > 0) {
      const allExist = await this.facilityService.validateFacilitiesExist(
        updateRoomDto.facilities,
      );
      if (!allExist) {
        this.cleanupFiles(newImagePaths);
        throw new BadRequestException('One or more facility IDs do not exist');
      }
    }

    try {
      const updateData: UpdateQuery<Room> = {
        ...updateRoomDto,
      };

      if (updateRoomDto.facilities) {
        updateData.facilities = updateRoomDto.facilities.map(
          (fid) => new Types.ObjectId(fid),
        );
      }

      if (newImagePaths.length > 0) {
        // Append new images or replace? Standard is to append or keep, let's append
        updateData.images = [...(room.images || []), ...newImagePaths];
      }

      const updatedRoom = await this.roomModel
        .findByIdAndUpdate(id, updateData, { new: true, runValidators: true })
        .populate('facilities')
        .exec();

      if (!updatedRoom) {
        throw new NotFoundException(`Room with ID "${id}" not found`);
      }

      return updatedRoom;
    } catch (error) {
      this.cleanupFiles(newImagePaths);
      if ((error as { code?: number }).code === 11000) {
        throw new ConflictException(
          `Room with number "${updateRoomDto.roomNumber}" already exists`,
        );
      }
      throw error;
    }
  }

  async delete(id: string): Promise<Room> {
    const room = await this.roomModel.findById(id).exec();
    if (!room || room.isDeleted) {
      throw new NotFoundException(`Room with ID "${id}" not found`);
    }

    // Reject if active bookings exist
    // An active booking is a pending or confirmed booking whose checkOut date is in the future
    const activeBooking = await this.bookingModel
      .findOne({
        roomId: id,
        status: { $in: [BookingStatus.PENDING, BookingStatus.CONFIRMED] },
        checkOut: { $gte: new Date() },
      })
      .exec();

    if (activeBooking) {
      throw new BadRequestException(
        'Cannot delete room with active/upcoming bookings',
      );
    }

    room.isDeleted = true;
    return await room.save();
  }

  async updateAverageRating(roomId: string): Promise<Room> {
    const room = await this.roomModel.findById(roomId).exec();
    if (!room) {
      throw new NotFoundException(`Room with ID "${roomId}" not found`);
    }

    const reviews = await this.reviewModel.find({ roomId }).exec();
    if (reviews.length === 0) {
      room.averageRating = 0;
    } else {
      const sum = reviews.reduce((acc, r) => acc + r.rating, 0);
      room.averageRating = parseFloat((sum / reviews.length).toFixed(2));
    }

    return await room.save();
  }

  private cleanupFiles(filePaths: string[]) {
    filePaths.forEach((fp) => {
      try {
        const fullPath = path.join(__dirname, '../../..', fp);
        if (fs.existsSync(fullPath)) {
          fs.unlinkSync(fullPath);
        }
      } catch (error: unknown) {
        console.error('Error cleaning up file:', error);
      }
    });
  }
}
