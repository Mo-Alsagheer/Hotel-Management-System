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
import { RoomService } from '../room/interfaces/room-service.interface';
import { RoomRatingService } from '../room/interfaces/room-rating-service.interface';
import { CreateReviewDto } from './dtos/create-review.dto';

@Injectable()
export class ReviewService {
  constructor(
    @InjectModel(Review.name) private reviewModel: Model<ReviewDocument>,
    @InjectModel(Booking.name) private bookingModel: Model<BookingDocument>,
    private readonly roomService: RoomService,
    private readonly roomRatingService: RoomRatingService,
  ) {}

  async addReview(userId: string, roomId: string, dto: CreateReviewDto) {
    // verify room exists
    try {
      await this.roomService.findOne(roomId);
    } catch {
      throw new NotFoundException(`Room with ID "${roomId}" not found`);
    }

    // verify user had a booking in this room that is completed/past
    const completedBooking = await this.bookingModel
      .findOne({
        userId: new Types.ObjectId(userId),
        roomId: new Types.ObjectId(roomId),
        status: BookingStatus.COMPLETED,
      })
      .exec();

    if (!completedBooking) {
      throw new BadRequestException(
        'You can only review rooms you have booked and completed stay in.',
      );
    }

    // check if already reviewed
    const existing = await this.reviewModel
      .findOne({
        userId: new Types.ObjectId(userId),
        roomId: new Types.ObjectId(roomId),
      })
      .exec();

    if (existing) {
      throw new ConflictException('You have already reviewed this room.');
    }

    const created = await new this.reviewModel({
      userId: new Types.ObjectId(userId),
      roomId: new Types.ObjectId(roomId),
      rating: dto.rating,
      comment: dto.comment,
    }).save();

    await this.roomRatingService.updateAverageRating(roomId);

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
    const [data, total] = await Promise.all([
      this.reviewModel
        .find({ roomId: new Types.ObjectId(roomId) })
        .populate('userId', 'name profileImage')
        .skip(skip)
        .limit(limit)
        .lean()
        .exec(),
      this.reviewModel.countDocuments({ roomId: new Types.ObjectId(roomId) }),
    ]);

    return {
      data,
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
    await this.roomRatingService.updateAverageRating(roomId);

    return { deleted: true };
  }
}
