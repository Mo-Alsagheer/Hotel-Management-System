import { IsOptional, IsString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateFacilityDto {
  @ApiPropertyOptional({ example: 'WiFi', description: 'Name of the facility' })
  @IsString()
  @IsOptional()
  name?: string;
}
