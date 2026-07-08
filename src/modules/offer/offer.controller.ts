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
  UploadedFile,
  UseGuards,
} from '@nestjs/common';
import { OfferService } from './offer.service';
import { CreateOfferDto } from './dtos/create-offer.dto';
import { UpdateOfferDto } from './dtos/update-offer.dto';
import { OfferQueryDto } from './dtos/offer-query.dto';
import * as requestInterface from '../../common/interfaces/request.interface';
import { ApiBearerAuth, ApiTags, ApiConsumes } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../user/schemas/user.schema';
import { LocalFilesInterceptor } from '../../common/interceptors/local-files.interceptor';

@ApiTags('Offers')
@Controller()
export class OfferController {
  constructor(private readonly offerService: OfferService) {}

  // Admin: Create Offer
  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiConsumes('multipart/form-data')
  @Post('admin/offers')
  @UseInterceptors(
    LocalFilesInterceptor({
      fieldName: 'image',
      path: './uploads/offers',
      type: 'single',
    }),
  )
  async create(
    @UploadedFile() file: Express.Multer.File,
    @Body() createOfferDto: CreateOfferDto,
    @Req() req: requestInterface.CustomRequest,
  ) {
    const imagePath = file ? `/uploads/offers/${file.filename}` : undefined;
    req.successMessage = 'Offer created successfully';
    return this.offerService.create(createOfferDto, imagePath);
  }

  // Admin: Get All Offers
  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @Get('admin/offers')
  async findAllAdmin(
    @Query() query: OfferQueryDto,
    @Req() req: requestInterface.CustomRequest,
  ) {
    req.successMessage = 'Offers retrieved successfully';
    return this.offerService.findAll(query.page, query.limit);
  }

  // Admin: Update Offer
  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiConsumes('multipart/form-data')
  @Put('admin/offers/:id')
  @UseInterceptors(
    LocalFilesInterceptor({
      fieldName: 'image',
      path: './uploads/offers',
      type: 'single',
    }),
  )
  async update(
    @Param('id') id: string,
    @UploadedFile() file: Express.Multer.File,
    @Body() updateOfferDto: UpdateOfferDto,
    @Req() req: requestInterface.CustomRequest,
  ) {
    const imagePath = file ? `/uploads/offers/${file.filename}` : undefined;
    req.successMessage = 'Offer updated successfully';
    return this.offerService.update(id, updateOfferDto, imagePath);
  }

  // Admin: Delete Offer
  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @Delete('admin/offers/:id')
  async delete(
    @Param('id') id: string,
    @Req() req: requestInterface.CustomRequest,
  ) {
    req.successMessage = 'Offer deleted successfully';
    return this.offerService.delete(id);
  }

  // Public: Get All Offers
  @Get('offers')
  async findAllPublic(
    @Query() query: OfferQueryDto,
    @Req() req: requestInterface.CustomRequest,
  ) {
    req.successMessage = 'Offers retrieved successfully';
    return this.offerService.findAll(query.page, query.limit);
  }

  // Public: Get Single Offer
  @Get('offers/:id')
  async findOne(
    @Param('id') id: string,
    @Req() req: requestInterface.CustomRequest,
  ) {
    req.successMessage = 'Offer retrieved successfully';
    return this.offerService.findOne(id);
  }
}
