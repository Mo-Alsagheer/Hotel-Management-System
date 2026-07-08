import { Types } from 'mongoose';
import { CreateRoomDto } from '../dtos/create-room.dto';
import { UpdateRoomDto } from '../dtos/update-room.dto';
import { RoomQueryDto } from '../dtos/room-query.dto';
import { Room } from '../schemas/room.schema';
import { PaginatedResponse } from '../../../common/interfaces/paginated-response.interface';

export abstract class RoomService {
  abstract create(
    createRoomDto: CreateRoomDto,
    imagePaths: string[],
  ): Promise<Room>;

  abstract findAll(dto: RoomQueryDto): Promise<PaginatedResponse<Room>>;

  abstract findOne(id: string): Promise<
    Room & {
      reviews: {
        id: Types.ObjectId;
        rating: number;
        comment?: string;
        userName: string;
      }[];
    }
  >;

  abstract update(
    id: string,
    updateRoomDto: UpdateRoomDto,
    newImagePaths?: string[],
  ): Promise<Room>;

  abstract delete(id: string): Promise<{ message: string }>;

  abstract removeImage(
    id: string,
    imageName: string,
  ): Promise<{ message: string }>;
}
