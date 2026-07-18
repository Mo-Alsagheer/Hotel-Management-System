import {
  IsOptional,
  IsNumber,
  IsString,
  Min,
  Max,
  IsArray,
  IsMongoId,
} from 'class-validator';
import { Type, Transform } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateRoomDto {
  @ApiPropertyOptional({ example: '101', description: 'Unique room number' })
  @IsString()
  @IsOptional()
  roomNumber?: string;

  @ApiPropertyOptional({ example: 2, description: 'Maximum guest capacity' })
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @IsOptional()
  capacity?: number;

  @ApiPropertyOptional({ example: 150, description: 'Price per night in USD' })
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @IsOptional()
  price?: number;

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
    example: 'A luxury double room with sea view',
    description: 'Description of the room',
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({
    type: [String],
    example: ['60d5ec4934b123456789abcd'],
    description: 'Array of facility ObjectIds',
  })
  @IsOptional()
  @Transform(({ value }) => {
    const val = value as unknown;
    if (typeof val === 'string') {
      if (val.trim() === '') return [];
      try {
        const parsed: unknown = JSON.parse(val);
        if (Array.isArray(parsed)) return parsed as string[];
      } catch {
        return val
          .split(',')
          .map((s) => s.trim())
          .filter((s) => s !== '');
      }
      return [val.trim()];
    }
    return val;
  })
  @IsArray()
  @IsMongoId({ each: true })
  facilities?: string[];
}
