import { Types } from 'mongoose';
import { RoomDocument } from '../schemas/room.schema';

export abstract class RoomRatingService {
  abstract getRoomReviews(roomId: Types.ObjectId): Promise<
    Array<{
      id: Types.ObjectId;
      rating: number;
      comment?: string;
      userName: string;
    }>
  >;

  abstract updateAverageRating(roomId: string): Promise<RoomDocument>;
}
