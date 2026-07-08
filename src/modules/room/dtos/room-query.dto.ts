import { IsOptional, IsString, IsDate, IsNumber, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { PaginationQueryDto } from '../../../common/dtos/pagination-query.dto';

export class RoomQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({
    example: '101',
    description: 'Search term by room number or description',
  })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({
    example: '2026-07-08T00:00:00.000Z',
    description: 'Check-in date',
  })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  checkIn?: Date;

  @ApiPropertyOptional({
    example: '2026-07-15T00:00:00.000Z',
    description: 'Check-out date',
  })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  checkOut?: Date;

  @ApiPropertyOptional({ example: 2, description: 'Minimum guest capacity' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  capacity?: number;
}
