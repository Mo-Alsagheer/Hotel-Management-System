import { UserQueryDto } from '../dtos/user-query.dto';
import { PaginationQueryDto } from '../../../common/dtos/pagination-query.dto';
import { PaginatedResponse } from '../../../common/interfaces/paginated-response.interface';
import { User, UserDocument } from '../schemas/user.schema';
import { UpdateProfileDto } from '../../auth/dtos/update-profile.dto';

export interface IUserService {
  findAll(
    query: UserQueryDto,
    pagination: PaginationQueryDto,
  ): Promise<PaginatedResponse<Partial<User>>>;
  findOneById(id: string): Promise<UserDocument>;
  updateProfile(userId: string, dto: UpdateProfileDto): Promise<UserDocument>;
  deactivate(id: string, adminUserId: string): Promise<{ message: string }>;
}
