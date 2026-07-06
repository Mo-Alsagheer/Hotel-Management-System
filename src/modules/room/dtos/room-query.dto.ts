import { IsOptional, IsString, IsDate, IsNumber, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { PaginationQueryDto } from '../../../common/dtos/pagination-query.dto';

export class RoomQueryDto extends PaginationQueryDto {
  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @Type(() => Date)
  @IsDate()
  checkIn?: Date;

  @IsOptional()
  @Type(() => Date)
  @IsDate()
  checkOut?: Date;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  capacity?: number;
}
