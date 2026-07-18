import {
  IsNumber,
  IsString,
  Min,
  IsOptional,
  IsMongoId,
  IsDate,
  IsBoolean,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateOfferDto {
  @ApiProperty({ example: 'Summer Deal', required: false })
  @IsString()
  @IsOptional()
  title?: string;

  @ApiProperty({ example: 'Get 20% off on all double rooms', required: false })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ example: 150, required: false })
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @IsOptional()
  price?: number;

  @ApiProperty({ example: '60d5ec4934b123456789abcd', required: false })
  @IsOptional()
  @IsMongoId()
  roomId?: string;

  @ApiProperty({ example: '2026-07-01T00:00:00.000Z', required: false })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  startDate?: Date;

  @ApiProperty({ example: '2026-08-31T00:00:00.000Z', required: false })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  endDate?: Date;

  @ApiProperty({ example: true, required: false })
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  isActive?: boolean;
}
