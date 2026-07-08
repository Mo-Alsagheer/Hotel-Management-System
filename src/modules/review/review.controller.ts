import {
  Controller,
  Post,
  Body,
  Param,
  Req,
  UseGuards,
  Get,
  Query,
  Delete,
} from '@nestjs/common';
import { ReviewService } from './review.service';
import { CreateReviewDto } from './dtos/create-review.dto';
import * as requestInterface from '../../common/interfaces/request.interface';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { PaginationQueryDto } from '../../common/dtos/pagination-query.dto';

@Controller()
export class ReviewController {
  constructor(private readonly reviewService: ReviewService) {}

  @UseGuards(JwtAuthGuard)
  @Post('rooms/:id/reviews')
  async addReview(
    @Param('id') roomId: string,
    @Body() dto: CreateReviewDto,
    @CurrentUser() user: { userId: string },
    @Req() req: requestInterface.CustomRequest,
  ) {
    req.successMessage = 'Review added successfully';
    return this.reviewService.addReview(user.userId, roomId, dto);
  }

  @Get('rooms/:id/reviews')
  async getRoomReviews(
    @Param('id') roomId: string,
    @Query() query: PaginationQueryDto,
    @Req() req: requestInterface.CustomRequest,
  ) {
    req.successMessage = 'Reviews retrieved successfully';
    return this.reviewService.getRoomReviews(roomId, query.page, query.limit);
  }

  @UseGuards(JwtAuthGuard)
  @Delete('rooms/:roomId/reviews/:reviewId')
  async deleteReview(
    @Param('reviewId') reviewId: string,
    @CurrentUser() user: { userId: string; role?: string },
    @Req() req: requestInterface.CustomRequest,
  ) {
    req.successMessage = 'Review deleted successfully';
    return this.reviewService.deleteReview(user, reviewId);
  }
}
