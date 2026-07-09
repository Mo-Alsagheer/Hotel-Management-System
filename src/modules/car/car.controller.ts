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
import { CarService } from './interfaces/car-service.interface';
import { CreateCarDto } from './dtos/create-car.dto';
import { UpdateCarDto } from './dtos/update-car.dto';
import { CarQueryDto } from './dtos/car-query.dto';
import { LocalFilesInterceptor } from '../../common/interceptors/local-files.interceptor';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../user/schemas/user.schema';
import { SuccessMessage } from '../../common/decorators/success-message.decorator';
import { ParseObjectIdPipe } from '../../common/pipes/parse-object-id.pipe';

@ApiTags('Cars')
@Controller()
export class CarController {
  constructor(private readonly carService: CarService) {}

  // 1. Admin: Create Car
  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @SuccessMessage('Car created successfully')
  @Post('admin/cars')
  @UseInterceptors(
    LocalFilesInterceptor({
      fieldName: 'images',
      maxCount: 10,
      path: './uploads/cars',
      allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'],
      maxFileSize: 5 * 1024 * 1024,
    }),
  )
  async create(
    @UploadedFiles() files: Express.Multer.File[],
    @Body() createCarDto: CreateCarDto,
  ) {
    const filePaths = files?.map((f) => `/uploads/cars/${f.filename}`) || [];
    return this.carService.create(createCarDto, filePaths);
  }

  // 2. Admin: Get Single Car
  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @SuccessMessage('Car retrieved successfully')
  @Get('admin/cars/:id')
  async findOneAdmin(@Param('id', ParseObjectIdPipe) id: string) {
    return this.carService.findOne(id);
  }

  // 3. Admin: Update Car
  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @SuccessMessage('Car updated successfully')
  @Put('admin/cars/:id')
  @UseInterceptors(
    LocalFilesInterceptor({
      fieldName: 'images',
      maxCount: 10,
      path: './uploads/cars',
      allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'],
      maxFileSize: 5 * 1024 * 1024,
    }),
  )
  async update(
    @Param('id', ParseObjectIdPipe) id: string,
    @UploadedFiles() files: Express.Multer.File[],
    @Body() updateCarDto: UpdateCarDto,
  ) {
    const filePaths = files?.map((f) => `/uploads/cars/${f.filename}`) || [];
    return this.carService.update(id, updateCarDto, filePaths);
  }

  // 4. Admin: Delete Car
  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @SuccessMessage('Car deleted successfully')
  @Delete('admin/cars/:id')
  async delete(@Param('id', ParseObjectIdPipe) id: string) {
    return this.carService.delete(id);
  }

  // 5. Admin: Delete Car Image
  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @SuccessMessage('Car image deleted successfully')
  @Delete('admin/cars/:id/images/:imageName')
  async removeImage(
    @Param('id', ParseObjectIdPipe) id: string,
    @Param('imageName') imageName: string,
  ) {
    return this.carService.removeImage(id, imageName);
  }

  // 6. Public: Get All Cars
  @SuccessMessage('Cars retrieved successfully')
  @Get('cars')
  async findAllPublic(@Query() query: CarQueryDto) {
    return this.carService.findAll(query);
  }

  // 7. Public: Get Available Cars
  @SuccessMessage('Available cars retrieved successfully')
  @Get('cars/available')
  async findAvailable(@Query() query: CarQueryDto) {
    return this.carService.findAvailable(query);
  }

  // 8. Public: Get Single Car Details
  @SuccessMessage('Car details retrieved successfully')
  @Get('cars/:id')
  async findOnePublic(@Param('id', ParseObjectIdPipe) id: string) {
    return this.carService.findOne(id);
  }
}
