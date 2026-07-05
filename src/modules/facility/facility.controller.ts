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
  UseGuards,
} from '@nestjs/common';
import { FacilityService } from './facility.service';
import { CreateFacilityDto } from './dtos/create-facility.dto';
import { UpdateFacilityDto } from './dtos/update-facility.dto';
import { FacilityQueryDto } from './dtos/facility-query.dto';
import * as requestInterface from '../../common/interfaces/request.interface';
import { ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../user/schemas/user.schema';

@Controller()
export class FacilityController {
  constructor(private readonly facilityService: FacilityService) {}

  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @Post('admin/facilities')
  async create(
    @Body() createFacilityDto: CreateFacilityDto,
    @Req() req: requestInterface.CustomRequest,
  ) {
    req.successMessage = 'Facility created successfully';
    return this.facilityService.create(createFacilityDto);
  }

  @Get('facilities')
  async findAll(
    @Query() query: FacilityQueryDto,
    @Req() req: requestInterface.CustomRequest,
  ) {
    req.successMessage = 'Facilities retrieved successfully';
    return this.facilityService.findAll(query.page, query.limit);
  }

  @Get('facilities/:id')
  async findOne(
    @Param('id') id: string,
    @Req() req: requestInterface.CustomRequest,
  ) {
    req.successMessage = 'Facility retrieved successfully';
    return this.facilityService.findOne(id);
  }

  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @Put('admin/facilities/:id')
  async update(
    @Param('id') id: string,
    @Body() updateFacilityDto: UpdateFacilityDto,
    @Req() req: requestInterface.CustomRequest,
  ) {
    req.successMessage = 'Facility updated successfully';
    return this.facilityService.update(id, updateFacilityDto);
  }

  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @Delete('admin/facilities/:id')
  async delete(
    @Param('id') id: string,
    @Req() req: requestInterface.CustomRequest,
  ) {
    req.successMessage = 'Facility deleted successfully';
    return this.facilityService.delete(id);
  }
}
