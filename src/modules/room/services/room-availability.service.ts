import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  Booking,
  BookingDocument,
  BookingStatus,
} from '../../booking/schemas/booking.schema';
import { RoomAvailabilityService } from '../interfaces/room-availability-service.interface';

@Injectable()
export class MongooseRoomAvailabilityService extends RoomAvailabilityService {
  constructor(
    @InjectModel(Booking.name)
    private readonly bookingModel: Model<BookingDocument>,
  ) {
    super();
  }

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
}
