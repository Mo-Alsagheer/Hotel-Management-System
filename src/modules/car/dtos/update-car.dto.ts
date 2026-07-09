import {
  IsOptional,
  IsNumber,
  IsString,
  IsEnum,
  IsBoolean,
  Min,
  Max,
} from 'class-validator';
import { Type, Transform } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transmission, FuelType } from '../schemas/car.schema';

export class UpdateCarDto {
  @ApiPropertyOptional({ example: 'Camry', description: 'Car model name' })
  @IsString()
  @IsOptional()
  model?: string;

  @ApiPropertyOptional({ example: 'Toyota', description: 'Car brand' })
  @IsString()
  @IsOptional()
  brand?: string;

  @ApiPropertyOptional({ example: 2024, description: 'Manufacturing year' })
  @Type(() => Number)
  @IsNumber()
  @Min(1900)
  @Max(new Date().getFullYear() + 1)
  @IsOptional()
  year?: number;

  @ApiPropertyOptional({ example: 'White', description: 'Car color' })
  @IsString()
  @IsOptional()
  color?: string;

  @ApiPropertyOptional({
    example: 'ABC-1234',
    description: 'Unique plate number',
  })
  @IsString()
  @IsOptional()
  plateNumber?: string;

  @ApiPropertyOptional({
    example: 50,
    description: 'Rental price per day in USD',
  })
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @IsOptional()
  pricePerDay?: number;

  @ApiPropertyOptional({
    example: 10,
    description: 'Discount percentage (0-100)',
  })
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(100)
  @IsOptional()
  discount?: number;

  @ApiPropertyOptional({
    example: 'A comfortable sedan with great fuel economy',
    description: 'Description of the car',
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ example: 5, description: 'Number of seats' })
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @IsOptional()
  seats?: number;

  @ApiPropertyOptional({
    enum: Transmission,
    example: Transmission.AUTOMATIC,
    description: 'Transmission type',
  })
  @IsOptional()
  @IsEnum(Transmission)
  transmission?: Transmission;

  @ApiPropertyOptional({
    enum: FuelType,
    example: FuelType.PETROL,
    description: 'Fuel type',
  })
  @IsOptional()
  @IsEnum(FuelType)
  fuelType?: FuelType;

  @ApiPropertyOptional({
    example: true,
    description: 'Whether the car is available for rental',
  })
  @IsOptional()
  @Transform(({ value }) => {
    const val = value as unknown;
    if (val === 'true') return true;
    if (val === 'false') return false;
    return val;
  })
  @IsBoolean()
  isAvailable?: boolean;
}
