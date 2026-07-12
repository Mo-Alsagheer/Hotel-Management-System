import { Controller, Get, UseGuards } from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import {
  DashboardStats,
  DashboardChartData,
} from './interfaces/dashboard.interface';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../user/schemas/user.schema';
import { SuccessMessage } from '../../common/decorators/success-message.decorator';

@ApiTags('Admin Dashboard')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller()
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Roles(UserRole.ADMIN)
  @SuccessMessage('Dashboard stats retrieved successfully')
  @Get('admin/dashboard')
  async getStats(): Promise<DashboardStats> {
    return this.dashboardService.getStats();
  }

  @Roles(UserRole.ADMIN)
  @SuccessMessage('Dashboard chart data retrieved successfully')
  @Get('admin/dashboard/charts')
  async getChartData(): Promise<DashboardChartData> {
    return this.dashboardService.getChartData();
  }
}
