import { IsOptional, IsString } from 'class-validator';

export class UpdateFacilityDto {
  @IsString()
  @IsOptional()
  name?: string;
}
