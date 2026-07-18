import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type BookingDocument = HydratedDocument<Booking>;

export enum BookingStatus {
  PENDING = 'pending',
  CONFIRMED = 'confirmed',
  CANCELLED = 'cancelled',
  COMPLETED = 'completed',
}

@Schema({
  timestamps: true,
  versionKey: false,
})
export class Booking {
  @Prop({
    type: Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  })
  userId: Types.ObjectId;

  @Prop({
    type: Types.ObjectId,
    ref: 'Room',
    required: true,
    index: true,
  })
  roomId: Types.ObjectId;

  @Prop({
    type: Date,
    required: true,
  })
  checkIn: Date;

  @Prop({
    type: Date,
    required: true,
  })
  checkOut: Date;

  @Prop({
    required: true,
    min: 0,
  })
  totalPrice: number;

  @Prop({
    enum: BookingStatus,
    default: BookingStatus.PENDING,
    index: true,
  })
  status: BookingStatus;
}

export const BookingSchema = SchemaFactory.createForClass(Booking);
BookingSchema.index({ roomId: 1, checkIn: 1, checkOut: 1 });
BookingSchema.index({ userId: 1, createdAt: 1 });
