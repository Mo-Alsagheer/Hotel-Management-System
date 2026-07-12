import {
  Controller,
  Post,
  Delete,
  Get,
  Param,
  UseGuards,
  Query,
} from '@nestjs/common';
import { FavoriteService } from './favorite.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { PaginationQueryDto } from '../../common/dtos/pagination-query.dto';
import { SuccessMessage } from '../../common/decorators/success-message.decorator';

@Controller()
export class FavoriteController {
  constructor(private readonly favService: FavoriteService) {}

  @UseGuards(JwtAuthGuard)
  @SuccessMessage('Added to favourites')
  @Post('favourites/:roomId')
  async addFavorite(
    @Param('roomId') roomId: string,
    @CurrentUser() user: { userId: string },
  ) {
    return this.favService.addFavorite(user.userId, roomId);
  }

  @UseGuards(JwtAuthGuard)
  @SuccessMessage('Removed from favourites')
  @Delete('favourites/:roomId')
  async removeFavorite(
    @Param('roomId') roomId: string,
    @CurrentUser() user: { userId: string },
  ) {
    return this.favService.removeFavorite(user.userId, roomId);
  }

  @UseGuards(JwtAuthGuard)
  @SuccessMessage('Favourites retrieved successfully')
  @Get('favourites')
  async getMyFavorites(
    @CurrentUser() user: { userId: string },
    @Query() query: PaginationQueryDto,
  ) {
    return this.favService.getMyFavorites(user.userId, query.page, query.limit);
  }
}
