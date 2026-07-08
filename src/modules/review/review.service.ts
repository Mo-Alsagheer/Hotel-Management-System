import {
  Injectable,
  BadRequestException,
  ConflictException,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Review, ReviewDocument } from './schemas/review.schema';
import {
  Booking,
  BookingDocument,
  BookingStatus,
} from '../booking/schemas/booking.schema';
import { RoomService } from '../room/room.service';
import { CreateReviewDto } from './dtos/create-review.dto';

@Injectable()
export class ReviewService {
  constructor(
    @InjectModel(Review.name) private reviewModel: Model<ReviewDocument>,
    @InjectModel(Booking.name) private bookingModel: Model<BookingDocument>,
    private readonly roomService: RoomService,
  ) {}

  async addReview(userId: string, roomId: string, dto: CreateReviewDto) {
    // verify room exists
    try {
      await this.roomService.findOne(roomId);
    } catch {
      throw new NotFoundException(`Room with ID "${roomId}" not found`);
    }

    // verify user has a booking for this room (not cancelled)
    const booking = await this.bookingModel.findOne({
      userId: new Types.ObjectId(userId),
      roomId: new Types.ObjectId(roomId),
      $or: [
        { status: BookingStatus.CONFIRMED },
        { status: BookingStatus.COMPLETED },
        { checkOut: { $lt: new Date() } },
      ],
    });

    if (!booking) {
      throw new BadRequestException(
        'You can only review rooms you have booked',
      );
    }

    // prevent duplicate review
    const existing = await this.reviewModel.findOne({
      userId: new Types.ObjectId(userId),
      roomId: new Types.ObjectId(roomId),
    });
    if (existing) {
      throw new ConflictException('You have already reviewed this room');
    }

    const created = await new this.reviewModel({
      userId: new Types.ObjectId(userId),
      roomId: new Types.ObjectId(roomId),
      rating: dto.rating,
      comment: dto.comment,
    }).save();

    await this.roomService.updateAverageRating(roomId);

    return created;
  }

  async getRoomReviews(roomId: string, page = 1, limit = 10) {
    // ensure room exists
    try {
      await this.roomService.findOne(roomId);
    } catch {
      throw new NotFoundException(`Room with ID "${roomId}" not found`);
    }

    const skip = (page - 1) * limit;
    type PopulatedReview = ReviewDocument & {
      userId: { name?: string; profileImage?: string } | Types.ObjectId;
      createdAt?: Date;
    };

    const [data, total] = await Promise.all([
      this.reviewModel
        .find({ roomId: new Types.ObjectId(roomId) })
        .populate('userId', 'name profileImage')
        .skip(skip)
        .limit(limit)
        .exec() as Promise<PopulatedReview[]>,
      this.reviewModel
        .countDocuments({ roomId: new Types.ObjectId(roomId) })
        .exec(),
    ]);

    const formatted = data.map((r) => ({
      id: r._id,
      rating: r.rating,
      comment: r.comment,
      user: r.userId,
      createdAt: r.createdAt,
    }));

    return {
      data: formatted,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async deleteReview(
    user: { userId: string; role?: string },
    reviewId: string,
  ) {
    const review = await this.reviewModel.findById(reviewId).exec();
    if (!review) {
      throw new NotFoundException('Review not found');
    }

    // allow admin or owner
    if (user.role !== 'admin' && review.userId.toString() !== user.userId) {
      throw new ForbiddenException('Not authorized to delete this review');
    }

    const roomId = review.roomId.toString();
    await this.reviewModel.findByIdAndDelete(reviewId).exec();
    await this.roomService.updateAverageRating(roomId);

    return { deleted: true };
  }
}
