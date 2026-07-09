import { IsOptional, IsString, IsNumber, IsEnum, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { PaginationQueryDto } from '../../../common/dtos/pagination-query.dto';
import { Transmission, FuelType } from '../schemas/car.schema';

export class CarQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({
    example: 'Toyota',
    description: 'Search term by model, brand, or description',
  })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({
    example: 'Toyota',
    description: 'Filter by brand',
  })
  @IsOptional()
  @IsString()
  brand?: string;

  @ApiPropertyOptional({
    enum: Transmission,
    description: 'Filter by transmission type',
  })
  @IsOptional()
  @IsEnum(Transmission)
  transmission?: Transmission;

  @ApiPropertyOptional({
    enum: FuelType,
    description: 'Filter by fuel type',
  })
  @IsOptional()
  @IsEnum(FuelType)
  fuelType?: FuelType;

  @ApiPropertyOptional({
    example: 20,
    description: 'Minimum price per day',
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  minPrice?: number;

  @ApiPropertyOptional({
    example: 200,
    description: 'Maximum price per day',
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  maxPrice?: number;

  @ApiPropertyOptional({
    example: 4,
    description: 'Minimum number of seats',
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  seats?: number;
}
