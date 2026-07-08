import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class UserQueryDto {
  @ApiPropertyOptional({
    example: 'john',
    description: 'Search by name or email',
  })
  @IsOptional()
  @IsString()
  search?: string;
}
