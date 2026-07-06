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

export class CreateRoomDto {
  @IsString()
  @IsNotEmpty()
  roomNumber: string;

  @Type(() => Number)
  @IsNumber()
  @Min(1)
  capacity: number;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  price: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(100)
  discount?: number;

  @IsString()
  @IsOptional()
  description?: string;

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
