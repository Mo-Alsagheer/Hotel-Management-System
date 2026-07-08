import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseInterceptors,
  UploadedFiles,
  UseGuards,
} from '@nestjs/common';
import { RoomService } from './interfaces/room-service.interface';
import { CreateRoomDto } from './dtos/create-room.dto';
import { UpdateRoomDto } from './dtos/update-room.dto';
import { RoomQueryDto } from './dtos/room-query.dto';
import { LocalFilesInterceptor } from '../../common/interceptors/local-files.interceptor';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../user/schemas/user.schema';
import { SuccessMessage } from '../../common/decorators/success-message.decorator';
import { ParseObjectIdPipe } from '../../common/pipes/parse-object-id.pipe';

@ApiTags('Rooms')
@Controller()
export class RoomController {
  constructor(private readonly roomService: RoomService) {}

  // 1. Admin: Create Room
  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @SuccessMessage('Room created successfully')
  @Post('admin/rooms')
  @UseInterceptors(
    LocalFilesInterceptor({
      fieldName: 'images',
      maxCount: 10,
      path: './uploads/rooms',
      allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'],
      maxFileSize: 5 * 1024 * 1024,
    }),
  )
  async create(
    @UploadedFiles() files: Express.Multer.File[],
    @Body() createRoomDto: CreateRoomDto,
  ) {
    const filePaths = files?.map((f) => `/uploads/rooms/${f.filename}`) || [];
    return this.roomService.create(createRoomDto, filePaths);
  }

  // 3. Admin: Get Single Room
  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @SuccessMessage('Room retrieved successfully')
  @Get('admin/rooms/:id')
  async findOneAdmin(@Param('id', ParseObjectIdPipe) id: string) {
    return this.roomService.findOne(id);
  }

  // 4. Admin: Update Room
  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @SuccessMessage('Room updated successfully')
  @Put('admin/rooms/:id')
  @UseInterceptors(
    LocalFilesInterceptor({
      fieldName: 'images',
      maxCount: 10,
      path: './uploads/rooms',
      allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'],
      maxFileSize: 5 * 1024 * 1024,
    }),
  )
  async update(
    @Param('id', ParseObjectIdPipe) id: string,
    @UploadedFiles() files: Express.Multer.File[],
    @Body() updateRoomDto: UpdateRoomDto,
  ) {
    const filePaths = files?.map((f) => `/uploads/rooms/${f.filename}`) || [];
    return this.roomService.update(id, updateRoomDto, filePaths);
  }

  // 5. Admin: Delete Room
  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @SuccessMessage('Room deleted successfully')
  @Delete('admin/rooms/:id')
  async delete(@Param('id', ParseObjectIdPipe) id: string) {
    return this.roomService.delete(id);
  }

  // 6. Public User: Get Available Rooms
  @SuccessMessage('Rooms retrieved successfully')
  @Get('rooms')
  async findAllPublic(@Query() query: RoomQueryDto) {
    return this.roomService.findAll(query);
  }

  // 7. Public User: Get Single Room Details
  @SuccessMessage('Room details retrieved successfully')
  @Get('rooms/:id')
  async findOnePublic(@Param('id', ParseObjectIdPipe) id: string) {
    return this.roomService.findOne(id);
  }

  // 8. Admin: Delete Room Image
  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @SuccessMessage('Room image deleted successfully')
  @Delete('admin/rooms/:id/images/:imageName')
  async removeImage(
    @Param('id', ParseObjectIdPipe) id: string,
    @Param('imageName') imageName: string,
  ) {
    return this.roomService.removeImage(id, imageName);
  }
}
