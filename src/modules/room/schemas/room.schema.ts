import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type RoomDocument = HydratedDocument<Room>;

@Schema({
  timestamps: true,
  versionKey: false,
})
export class Room {
  @Prop({
    required: true,
    unique: true,
    trim: true,
  })
  roomNumber: string;

  @Prop({
    required: true,
    min: 1,
    index: true,
  })
  capacity: number;

  @Prop({
    required: true,
    min: 0,
    index: true,
  })
  price: number;

  @Prop({
    default: 0,
    min: 0,
    max: 100,
  })
  discount: number;

  @Prop({
    trim: true,
  })
  description?: string;

  @Prop({
    type: [{ type: Types.ObjectId, ref: 'Facility' }],
    default: [],
    index: true,
  })
  facilities: Types.ObjectId[];

  @Prop({
    type: [String],
    default: [],
  })
  images?: string[];

  @Prop({
    default: 0,
    min: 0,
    max: 5,
    index: true,
  })
  averageRating: number;

  @Prop({
    default: false,
    index: true,
  })
  isDeleted: boolean;
}

export const RoomSchema = SchemaFactory.createForClass(Room);
RoomSchema.index({ isDeleted: 1, price: 1 });
