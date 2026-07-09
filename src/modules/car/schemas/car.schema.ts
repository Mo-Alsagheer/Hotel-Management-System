import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type CarDocument = HydratedDocument<Car>;

export enum Transmission {
  AUTOMATIC = 'automatic',
  MANUAL = 'manual',
}

export enum FuelType {
  PETROL = 'petrol',
  DIESEL = 'diesel',
  ELECTRIC = 'electric',
  HYBRID = 'hybrid',
}

@Schema({
  timestamps: true,
  versionKey: false,
})
export class Car {
  @Prop({
    required: true,
    trim: true,
  })
  model: string;

  @Prop({
    required: true,
    trim: true,
    index: true,
  })
  brand: string;

  @Prop({
    required: true,
    min: 1900,
  })
  year: number;

  @Prop({
    required: true,
    trim: true,
  })
  color: string;

  @Prop({
    required: true,
    unique: true,
    trim: true,
  })
  plateNumber: string;

  @Prop({
    required: true,
    min: 0,
    index: true,
  })
  pricePerDay: number;

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
    required: true,
    min: 1,
    index: true,
  })
  seats: number;

  @Prop({
    enum: Transmission,
    default: Transmission.AUTOMATIC,
    index: true,
  })
  transmission: Transmission;

  @Prop({
    enum: FuelType,
    default: FuelType.PETROL,
    index: true,
  })
  fuelType: FuelType;

  @Prop({
    type: [String],
    default: [],
  })
  images?: string[];

  @Prop({
    default: true,
    index: true,
  })
  isAvailable: boolean;

  @Prop({
    default: false,
    index: true,
  })
  isDeleted: boolean;
}

export const CarSchema = SchemaFactory.createForClass(Car);
CarSchema.index({ isDeleted: 1, pricePerDay: 1 });
