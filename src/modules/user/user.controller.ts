import {
  Controller,
  Delete,
  Get,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { UserService } from './interfaces/user-service.interface';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from './schemas/user.schema';
import { PaginationQueryDto } from '../../common/dtos/pagination-query.dto';
import { UserQueryDto } from './dtos/user-query.dto';

import {
  CurrentUser,
  ICurrentUser,
} from '../../common/decorators/current-user.decorator';
import { ParseObjectIdPipe } from '../../common/pipes/parse-object-id.pipe';

@ApiTags('Admin Users')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('admin/users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Roles(UserRole.ADMIN)
  @Get()
  findAll(
    @Query() query: UserQueryDto,
    @Query() pagination: PaginationQueryDto,
  ) {
    return this.userService.findAll(query, pagination);
  }

  @Roles(UserRole.ADMIN)
  @Get(':id')
  findOne(@Param('id', ParseObjectIdPipe) id: string) {
    return this.userService.findOneById(id);
  }

  @Roles(UserRole.ADMIN)
  @Delete(':id')
  deactivate(
    @Param('id', ParseObjectIdPipe) id: string,
    @CurrentUser() admin: ICurrentUser,
  ) {
    return this.userService.deactivate(id, admin.userId);
  }
}
