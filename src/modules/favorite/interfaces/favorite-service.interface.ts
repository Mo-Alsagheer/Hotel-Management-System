import { Favorite } from '../schemas/favorite.schema';

export interface IFavoriteService {
  addFavorite(userId: string, roomId: string): Promise<Favorite>;
  removeFavorite(userId: string, roomId: string): Promise<{ removed: boolean }>;
  getMyFavorites(
    userId: string,
    page?: number,
    limit?: number,
  ): Promise<{
    data: Array<{ id: any; room: any }>;
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }>;
}
