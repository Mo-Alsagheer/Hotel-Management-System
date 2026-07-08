import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Room, RoomDocument } from '../schemas/room.schema';
import { Review, ReviewDocument } from '../../review/schemas/review.schema';
import { RoomRatingService } from '../interfaces/room-rating-service.interface';

interface PopulatedReview {
  _id: Types.ObjectId;
  rating: number;
  comment?: string;
  userId?: {
    name?: string;
  };
}

@Injectable()
export class MongooseRoomRatingService extends RoomRatingService {
  constructor(
    @InjectModel(Room.name) private readonly roomModel: Model<RoomDocument>,
    @InjectModel(Review.name)
    private readonly reviewModel: Model<ReviewDocument>,
  ) {
    super();
  }

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

    return (reviews as unknown as PopulatedReview[]).map((r) => ({
      id: r._id,
      rating: r.rating,
      comment: r.comment,
      userName: r.userId?.name || 'Anonymous',
    }));
  }

  async updateAverageRating(roomId: string): Promise<RoomDocument> {
    const room = await this.roomModel.findById(roomId).exec();
    if (!room) {
      throw new NotFoundException(`Room with ID "${roomId}" not found`);
    }

    const reviews = await this.reviewModel
      .find({ roomId: new Types.ObjectId(roomId) })
      .lean()
      .exec();
    if (reviews.length === 0) {
      room.averageRating = 0;
    } else {
      const sum = reviews.reduce((acc, r) => acc + r.rating, 0);
      room.averageRating = parseFloat((sum / reviews.length).toFixed(2));
    }

    return await room.save();
  }
}
