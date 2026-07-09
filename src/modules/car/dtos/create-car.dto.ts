import {
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsEnum,
  IsBoolean,
  Min,
  Max,
} from 'class-validator';
import { Type, Transform } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transmission, FuelType } from '../schemas/car.schema';

export class CreateCarDto {
  @ApiProperty({ example: 'Camry', description: 'Car model name' })
  @IsString()
  @IsNotEmpty()
  model: string;

  @ApiProperty({ example: 'Toyota', description: 'Car brand' })
  @IsString()
  @IsNotEmpty()
  brand: string;

  @ApiProperty({ example: 2024, description: 'Manufacturing year' })
  @Type(() => Number)
  @IsNumber()
  @Min(1900)
  @Max(new Date().getFullYear() + 1)
  year: number;

  @ApiProperty({ example: 'White', description: 'Car color' })
  @IsString()
  @IsNotEmpty()
  color: string;

  @ApiProperty({ example: 'ABC-1234', description: 'Unique plate number' })
  @IsString()
  @IsNotEmpty()
  plateNumber: string;

  @ApiProperty({ example: 50, description: 'Rental price per day in USD' })
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  pricePerDay: number;

  @ApiPropertyOptional({
    example: 10,
    description: 'Discount percentage (0-100)',
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(100)
  discount?: number;

  @ApiPropertyOptional({
    example: 'A comfortable sedan with great fuel economy',
    description: 'Description of the car',
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ example: 5, description: 'Number of seats' })
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  seats: number;

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
