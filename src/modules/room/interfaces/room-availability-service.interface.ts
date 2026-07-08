import { Types } from 'mongoose';

export abstract class RoomAvailabilityService {
  abstract getOccupiedRoomIds(
    checkIn: Date,
    checkOut: Date,
  ): Promise<Types.ObjectId[]>;

  abstract validateRoomDeletion(roomId: string): Promise<void>;
}
