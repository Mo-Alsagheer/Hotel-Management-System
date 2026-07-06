import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { PaginationQueryDto } from '../../common/dtos/pagination-query.dto';
import { UserQueryDto } from './dtos/user-query.dto';
import { User, UserDocument } from './schemas/user.schema';

@Injectable()
export class UserService {
  constructor(
    @InjectModel(User.name)
    private readonly userModel: Model<UserDocument>,
  ) {}

  async findAll(query: UserQueryDto, pagination: PaginationQueryDto) {
    const { search } = query;
    const { page = 1, limit = 10 } = pagination;
    const filter: Record<string, unknown> = { isActive: true };

    if (search) {
      const regex = new RegExp(search.trim(), 'i');
      filter['$or'] = [{ name: regex }, { email: regex }];
    }

    const total = await this.userModel.countDocuments(filter);
    const users = await this.userModel
      .find(filter)
      .select('-password')
      .skip((page - 1) * limit)
      .limit(limit)
      .lean();

    return {
      data: users,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findOneById(id: string) {
    if (!Types.ObjectId.isValid(id)) {
      throw new NotFoundException('Invalid user ID.');
    }

    const user = await this.userModel.findById(id).select('-password');
    if (!user) {
      throw new NotFoundException('User not found.');
    }
    return user;
  }

  async deactivate(id: string) {
    if (!Types.ObjectId.isValid(id)) {
      throw new NotFoundException('Invalid user ID.');
    }

    const user = await this.userModel.findByIdAndUpdate(
      id,
      { isActive: false },
      { new: true, select: '-password' },
    );

    if (!user) {
      throw new NotFoundException('User not found.');
    }

    return { message: 'User deactivated successfully.' };
  }
}
