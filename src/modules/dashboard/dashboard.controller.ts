import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import {
  DashboardStats,
  DashboardChartData,
} from './interfaces/dashboard.interface';
import * as requestInterface from '../../common/interfaces/request.interface';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../user/schemas/user.schema';

@ApiTags('Admin Dashboard')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller()
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Roles(UserRole.ADMIN)
  @Get('admin/dashboard')
  async getStats(
    @Req() req: requestInterface.CustomRequest,
  ): Promise<DashboardStats> {
    req.successMessage = 'Dashboard stats retrieved successfully';
    return this.dashboardService.getStats();
  }

  @Roles(UserRole.ADMIN)
  @Get('admin/dashboard/charts')
  async getChartData(
    @Req() req: requestInterface.CustomRequest,
  ): Promise<DashboardChartData> {
    req.successMessage = 'Dashboard chart data retrieved successfully';
    return this.dashboardService.getChartData();
  }
}
