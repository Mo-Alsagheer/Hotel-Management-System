import { IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RefreshTokenDto {
  @ApiProperty({
    example: 'some_refresh_token_here',
    description: 'User refresh token',
  })
  @IsString()
  @IsNotEmpty()
  refreshToken: string;
}
