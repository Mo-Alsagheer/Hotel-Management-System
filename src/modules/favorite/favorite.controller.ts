import {
  Controller,
  Post,
  Delete,
  Get,
  Param,
  Req,
  UseGuards,
  Query,
} from '@nestjs/common';
import { FavoriteService } from './favorite.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import * as requestInterface from '../../common/interfaces/request.interface';
import { PaginationQueryDto } from '../../common/dtos/pagination-query.dto';

@Controller()
export class FavoriteController {
  constructor(private readonly favService: FavoriteService) {}

  @UseGuards(JwtAuthGuard)
  @Post('favourites/:roomId')
  async addFavorite(
    @Param('roomId') roomId: string,
    @CurrentUser() user: { userId: string },
    @Req() req: requestInterface.CustomRequest,
  ) {
    req.successMessage = 'Added to favourites';
    return this.favService.addFavorite(user.userId, roomId);
  }

  @UseGuards(JwtAuthGuard)
  @Delete('favourites/:roomId')
  async removeFavorite(
    @Param('roomId') roomId: string,
    @CurrentUser() user: { userId: string },
    @Req() req: requestInterface.CustomRequest,
  ) {
    req.successMessage = 'Removed from favourites';
    return this.favService.removeFavorite(user.userId, roomId);
  }

  @UseGuards(JwtAuthGuard)
  @Get('favourites')
  async getMyFavorites(
    @CurrentUser() user: { userId: string },
    @Query() query: PaginationQueryDto,
    @Req() req: requestInterface.CustomRequest,
  ) {
    req.successMessage = 'Favourites retrieved successfully';
    return this.favService.getMyFavorites(user.userId, query.page, query.limit);
  }
}
