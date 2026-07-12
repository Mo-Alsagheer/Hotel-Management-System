import {
  Controller,
  Post,
  Body,
  Param,
  UseGuards,
  Get,
  Query,
  Delete,
} from '@nestjs/common';
import { ReviewService } from './review.service';
import { CreateReviewDto } from './dtos/create-review.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { PaginationQueryDto } from '../../common/dtos/pagination-query.dto';
import { SuccessMessage } from '../../common/decorators/success-message.decorator';

@Controller()
export class ReviewController {
  constructor(private readonly reviewService: ReviewService) {}

  @UseGuards(JwtAuthGuard)
  @SuccessMessage('Review added successfully')
  @Post('rooms/:id/reviews')
  async addReview(
    @Param('id') roomId: string,
    @Body() dto: CreateReviewDto,
    @CurrentUser() user: { userId: string },
  ) {
    return this.reviewService.addReview(user.userId, roomId, dto);
  }

  @SuccessMessage('Reviews retrieved successfully')
  @Get('rooms/:id/reviews')
  async getRoomReviews(
    @Param('id') roomId: string,
    @Query() query: PaginationQueryDto,
  ) {
    return this.reviewService.getRoomReviews(roomId, query.page, query.limit);
  }

  @UseGuards(JwtAuthGuard)
  @SuccessMessage('Review deleted successfully')
  @Delete('rooms/:roomId/reviews/:reviewId')
  async deleteReview(
    @Param('reviewId') reviewId: string,
    @CurrentUser() user: { userId: string; role?: string },
  ) {
    return this.reviewService.deleteReview(user, reviewId);
  }
}
