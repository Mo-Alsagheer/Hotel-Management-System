import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { FacilityService } from './facility.service';
import { CreateFacilityDto } from './dtos/create-facility.dto';
import { UpdateFacilityDto } from './dtos/update-facility.dto';
import { FacilityQueryDto } from './dtos/facility-query.dto';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../user/schemas/user.schema';
import { ParseObjectIdPipe } from '../../common/pipes/parse-object-id.pipe';
import { SuccessMessage } from '../../common/decorators/success-message.decorator';

@ApiTags('Facilities')
@Controller()
export class FacilityController {
  constructor(private readonly facilityService: FacilityService) {}

  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @SuccessMessage('Facility created successfully')
  @Post('admin/facilities')
  async create(@Body() createFacilityDto: CreateFacilityDto) {
    return this.facilityService.create(createFacilityDto);
  }

  @SuccessMessage('Facilities retrieved successfully')
  @Get('facilities')
  async findAll(@Query() query: FacilityQueryDto) {
    return this.facilityService.findAll(query.page, query.limit);
  }

  @SuccessMessage('Facility retrieved successfully')
  @Get('facilities/:id')
  async findOne(@Param('id', ParseObjectIdPipe) id: string) {
    return this.facilityService.findOne(id);
  }

  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @SuccessMessage('Facility updated successfully')
  @Put('admin/facilities/:id')
  async update(
    @Param('id', ParseObjectIdPipe) id: string,
    @Body() updateFacilityDto: UpdateFacilityDto,
  ) {
    return this.facilityService.update(id, updateFacilityDto);
  }

  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @SuccessMessage('Facility deleted successfully')
  @Delete('admin/facilities/:id')
  async delete(@Param('id', ParseObjectIdPipe) id: string) {
    return this.facilityService.delete(id);
  }
}
