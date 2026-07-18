import {
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  Max,
  IsArray,
  IsMongoId,
} from 'class-validator';
import { Type, Transform } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateRoomDto {
  @ApiProperty({ example: '101', description: 'Unique room number' })
  @IsString()
  @IsNotEmpty()
  roomNumber: string;

  @ApiProperty({ example: 2, description: 'Maximum guest capacity' })
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  capacity: number;

  @ApiProperty({ example: 150, description: 'Price per night in USD' })
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  price: number;

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
