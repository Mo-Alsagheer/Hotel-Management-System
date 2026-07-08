import {
  Injectable,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Favorite, FavoriteDocument } from './schemas/favorite.schema';
import { RoomService } from '../room/interfaces/room-service.interface';

@Injectable()
export class FavoriteService {
  constructor(
    @InjectModel(Favorite.name) private favModel: Model<FavoriteDocument>,
    private readonly roomService: RoomService,
  ) {}

  async addFavorite(userId: string, roomId: string) {
    // ensure room exists
    try {
      await this.roomService.findOne(roomId);
    } catch {
      throw new NotFoundException(`Room with ID "${roomId}" not found`);
    }

    const existing = await this.favModel.findOne({
      userId: new Types.ObjectId(userId),
      roomId: new Types.ObjectId(roomId),
    });
    if (existing) {
      throw new ConflictException('Room already in favourites');
    }

    const created = await new this.favModel({
      userId: new Types.ObjectId(userId),
      roomId: new Types.ObjectId(roomId),
    }).save();

    return created;
  }

  async removeFavorite(userId: string, roomId: string) {
    const removed = await this.favModel.findOneAndDelete({
      userId: new Types.ObjectId(userId),
      roomId: new Types.ObjectId(roomId),
    });

    if (!removed) {
      throw new NotFoundException('Favourite not found');
    }

    return { removed: true };
  }

  async getMyFavorites(userId: string, page = 1, limit = 10) {
    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      this.favModel
        .find({ userId: new Types.ObjectId(userId) })
        .populate({ path: 'roomId', populate: 'facilities' })
        .skip(skip)
        .limit(limit)
        .exec(),
      this.favModel
        .countDocuments({ userId: new Types.ObjectId(userId) })
        .exec(),
    ]);

    type PopulatedFavorite = FavoriteDocument & {
      roomId: Record<string, unknown> | Types.ObjectId;
    };

    const formatted = (data as PopulatedFavorite[]).map((f) => ({
      id: f._id,
      room: f.roomId,
    }));

    return {
      data: formatted,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }
}
