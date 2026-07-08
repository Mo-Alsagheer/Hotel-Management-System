import { PaginationQueryDto } from '../../../common/dtos/pagination-query.dto';
import { UserQueryDto } from '../dtos/user-query.dto';
import { User, UserDocument } from '../schemas/user.schema';
import { PaginatedResponse } from '../../../common/interfaces/paginated-response.interface';
import { UpdateProfileDto } from '../../auth/dtos/update-profile.dto';

export abstract class UserService {
  abstract findAll(
    query: UserQueryDto,
    pagination: PaginationQueryDto,
  ): Promise<PaginatedResponse<Partial<User>>>;

  abstract findOneById(id: string): Promise<UserDocument>;

  abstract updateProfile(
    userId: string,
    dto: UpdateProfileDto,
  ): Promise<UserDocument>;

  abstract deactivate(
    id: string,
    adminUserId: string,
  ): Promise<{ message: string }>;
}
