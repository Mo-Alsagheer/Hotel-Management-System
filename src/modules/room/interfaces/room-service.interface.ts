import { Types } from 'mongoose';
import { Room } from '../schemas/room.schema';
import { CreateRoomDto } from '../dtos/create-room.dto';
import { UpdateRoomDto } from '../dtos/update-room.dto';
import { RoomQueryDto } from '../dtos/room-query.dto';
import { PaginatedResponse } from '../../../common/interfaces/paginated-response.interface';

export interface IRoomService {
  create(createRoomDto: CreateRoomDto, imagePaths?: string[]): Promise<Room>;
  findAll(dto: RoomQueryDto): Promise<PaginatedResponse<Room>>;
  findOne(id: string): Promise<
    Room & {
      reviews: Array<{
        id: Types.ObjectId;
        rating: number;
        comment?: string;
        userName: string;
      }>;
    }
  >;
  exists(id: string): Promise<boolean>;
  update(
    id: string,
    updateRoomDto: UpdateRoomDto,
    newImagePaths?: string[],
  ): Promise<Room>;
  delete(id: string): Promise<{ message: string }>;
  removeImage(id: string, imageName: string): Promise<{ message: string }>;
  getOccupiedRoomIds(checkIn: Date, checkOut: Date): Promise<Types.ObjectId[]>;
  validateRoomDeletion(roomId: string): Promise<void>;
  getRoomReviews(roomId: Types.ObjectId): Promise<
    Array<{
      id: Types.ObjectId;
      rating: number;
      comment?: string;
      userName: string;
    }>
  >;
  updateAverageRating(roomId: string): Promise<void>;
}
