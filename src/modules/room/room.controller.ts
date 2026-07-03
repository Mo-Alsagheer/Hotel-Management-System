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
} from '@nestjs/common';
import { RoomService } from './room.service';
import { CreateRoomDto } from './dtos/create-room.dto';
import { UpdateRoomDto } from './dtos/update-room.dto';
import { RoomQueryDto } from './dtos/room-query.dto';
import * as requestInterface from '../../common/interfaces/request.interface';
import { LocalFilesInterceptor } from '../../common/interceptors/local-files.interceptor';

@Controller()
export class RoomController {
  constructor(private readonly roomService: RoomService) {}

  // 1. Admin: Create Room
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
  @Get('admin/rooms')
  async findAllAdmin(
    @Query() query: RoomQueryDto,
    @Req() req: requestInterface.CustomRequest,
  ) {
    req.successMessage = 'Rooms retrieved successfully';
    return this.roomService.findAllAdmin(query.page, query.limit, query.search);
  }

  // 3. Admin: Get Single Room
  @Get('admin/rooms/:id')
  async findOneAdmin(
    @Param('id') id: string,
    @Req() req: requestInterface.CustomRequest,
  ) {
    req.successMessage = 'Room retrieved successfully';
    return this.roomService.findOne(id);
  }

  // 4. Admin: Update Room
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
