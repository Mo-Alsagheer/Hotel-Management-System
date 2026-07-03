import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type FacilityDocument = Facility & Document;

@Schema({ timestamps: { createdAt: true, updatedAt: false } })
export class Facility {
  @Prop({ required: true, unique: true, trim: true })
  name: string;
}

export const FacilitySchema = SchemaFactory.createForClass(Facility);
