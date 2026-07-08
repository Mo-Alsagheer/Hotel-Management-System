import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  Req,
  UseInterceptors,
  UploadedFiles,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { RoomService } from './room.service';
import { CreateRoomDto } from './dtos/create-room.dto';
import { UpdateRoomDto } from './dtos/update-room.dto';
import { RoomQueryDto } from './dtos/room-query.dto';
import * as requestInterface from '../../common/interfaces/request.interface';
import { LocalFilesInterceptor } from '../../common/interceptors/local-files.interceptor';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../user/schemas/user.schema';

@ApiTags('Rooms')
@Controller()
export class RoomController {
  constructor(private readonly roomService: RoomService) {}

  // 1. Admin: Create Room
  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @Post('admin/rooms')
  @UseInterceptors(
    LocalFilesInterceptor({
      fieldName: 'images',
      maxCount: 10,
      path: './uploads/rooms',
    }),
  )
  async create(
    @UploadedFiles() files: Express.Multer.File[],
    @Body() createRoomDto: CreateRoomDto,
    @Req() req: requestInterface.CustomRequest,
  ) {
    const filePaths = files?.map((f) => `/uploads/rooms/${f.filename}`) || [];
    req.successMessage = 'Room created successfully';
    return this.roomService.create(createRoomDto, filePaths);
  }

  // 2. Admin: Get All Rooms
  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @Get('admin/rooms')
  async findAllAdmin(
    @Query() query: RoomQueryDto,
    @Req() req: requestInterface.CustomRequest,
  ) {
    req.successMessage = 'Rooms retrieved successfully';
    return this.roomService.findAllAdmin(query.page, query.limit, query.search);
  }

  // 3. Admin: Get Single Room
  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @Get('admin/rooms/:id')
  async findOneAdmin(
    @Param('id') id: string,
    @Req() req: requestInterface.CustomRequest,
  ) {
    req.successMessage = 'Room retrieved successfully';
    return this.roomService.findOne(id);
  }

  // 4. Admin: Update Room
  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @Put('admin/rooms/:id')
  @UseInterceptors(
    LocalFilesInterceptor({
      fieldName: 'images',
      maxCount: 10,
      path: './uploads/rooms',
    }),
  )
  async update(
    @Param('id') id: string,
    @UploadedFiles() files: Express.Multer.File[],
    @Body() updateRoomDto: UpdateRoomDto,
    @Req() req: requestInterface.CustomRequest,
  ) {
    const filePaths = files?.map((f) => `/uploads/rooms/${f.filename}`) || [];
    req.successMessage = 'Room updated successfully';
    return this.roomService.update(id, updateRoomDto, filePaths);
  }

  // 5. Admin: Delete Room
  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @Delete('admin/rooms/:id')
  async delete(
    @Param('id') id: string,
    @Req() req: requestInterface.CustomRequest,
  ) {
    req.successMessage = 'Room deleted successfully';
    return this.roomService.delete(id);
  }

  // 6. Public User: Get Available Rooms
  @Get('rooms')
  async findAllPublic(
    @Query() query: RoomQueryDto,
    @Req() req: requestInterface.CustomRequest,
  ) {
    req.successMessage = 'Rooms retrieved successfully';
    return this.roomService.findAllPublic(
      query.page,
      query.limit,
      query.checkIn,
      query.checkOut,
      query.capacity,
    );
  }

  // 7. Public User: Get Single Room Details
  @Get('rooms/:id')
  async findOnePublic(
    @Param('id') id: string,
    @Req() req: requestInterface.CustomRequest,
  ) {
    req.successMessage = 'Room details retrieved successfully';
    return this.roomService.findOne(id);
  }
}
