import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type OfferDocument = Offer & Document;

@Schema({ timestamps: true })
export class Offer {
  @Prop({ required: true })
  title: string;

  @Prop({ required: true })
  description: string;

  @Prop({ required: true })
  price: number;

  @Prop()
  image?: string;

  @Prop({ type: Types.ObjectId, ref: 'Room', required: false })
  roomId?: Types.ObjectId;

  @Prop({ type: Date, required: false })
  startDate?: Date;

  @Prop({ type: Date, required: false })
  endDate?: Date;

  @Prop({ default: true, index: true })
  isActive: boolean;
}

export const OfferSchema = SchemaFactory.createForClass(Offer);
