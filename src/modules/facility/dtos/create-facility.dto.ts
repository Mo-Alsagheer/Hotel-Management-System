import { IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateFacilityDto {
  @ApiProperty({ example: 'WiFi', description: 'Name of the facility' })
  @IsString()
  @IsNotEmpty()
  name: string;
}
