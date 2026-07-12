import { Review } from '../schemas/review.schema';
import { CreateReviewDto } from '../dtos/create-review.dto';

export interface IReviewService {
  addReview(
    userId: string,
    roomId: string,
    dto: CreateReviewDto,
  ): Promise<Review>;
  getRoomReviews(
    roomId: string,
    page?: number,
    limit?: number,
  ): Promise<{
    data: any[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }>;
  deleteReview(
    user: { userId: string; role?: string },
    reviewId: string,
  ): Promise<{ deleted: boolean }>;
}
