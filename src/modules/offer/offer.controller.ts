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
  UploadedFile,
  UseGuards,
} from '@nestjs/common';
import { OfferService } from './interfaces/offer-service.interface';
import { CreateOfferDto } from './dtos/create-offer.dto';
import { UpdateOfferDto } from './dtos/update-offer.dto';
import { OfferQueryDto } from './dtos/offer-query.dto';
import { ApiBearerAuth, ApiTags, ApiConsumes } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../user/schemas/user.schema';
import { LocalFilesInterceptor } from '../../common/interceptors/local-files.interceptor';
import { ParseObjectIdPipe } from '../../common/pipes/parse-object-id.pipe';
import { SuccessMessage } from '../../common/decorators/success-message.decorator';

@ApiTags('Offers')
@Controller()
export class OfferController {
  constructor(private readonly offerService: OfferService) {}

  // Admin: Create Offer
  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiConsumes('multipart/form-data')
  @SuccessMessage('Offer created successfully')
  @Post('admin/offers')
  @UseInterceptors(
    LocalFilesInterceptor({
      fieldName: 'image',
      path: './uploads/offers',
      type: 'single',
      allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'],
      maxFileSize: 5 * 1024 * 1024,
    }),
  )
  async create(
    @UploadedFile() file: Express.Multer.File,
    @Body() createOfferDto: CreateOfferDto,
  ) {
    const imagePath = file ? `/uploads/offers/${file.filename}` : undefined;
    return this.offerService.create(createOfferDto, imagePath);
  }

  // Admin: Get All Offers
  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @SuccessMessage('Offers retrieved successfully')
  @Get('admin/offers')
  async findAllAdmin(@Query() query: OfferQueryDto) {
    return this.offerService.findAll(query.page, query.limit);
  }

  // Admin: Update Offer
  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiConsumes('multipart/form-data')
  @SuccessMessage('Offer updated successfully')
  @Put('admin/offers/:id')
  @UseInterceptors(
    LocalFilesInterceptor({
      fieldName: 'image',
      path: './uploads/offers',
      type: 'single',
      allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'],
      maxFileSize: 5 * 1024 * 1024,
    }),
  )
  async update(
    @Param('id', ParseObjectIdPipe) id: string,
    @UploadedFile() file: Express.Multer.File,
    @Body() updateOfferDto: UpdateOfferDto,
  ) {
    const imagePath = file ? `/uploads/offers/${file.filename}` : undefined;
    return this.offerService.update(id, updateOfferDto, imagePath);
  }

  // Admin: Delete Offer
  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @SuccessMessage('Offer deleted successfully')
  @Delete('admin/offers/:id')
  async delete(@Param('id', ParseObjectIdPipe) id: string) {
    return this.offerService.delete(id);
  }

  // Public: Get All Offers
  @SuccessMessage('Offers retrieved successfully')
  @Get('offers')
  async findAllPublic(@Query() query: OfferQueryDto) {
    return this.offerService.findAll(query.page, query.limit);
  }

  // Public: Get Single Offer
  @SuccessMessage('Offer retrieved successfully')
  @Get('offers/:id')
  async findOne(@Param('id', ParseObjectIdPipe) id: string) {
    return this.offerService.findOne(id);
  }
}
