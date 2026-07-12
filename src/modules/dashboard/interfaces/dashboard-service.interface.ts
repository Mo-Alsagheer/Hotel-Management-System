import { DashboardStats, DashboardChartData } from './dashboard.interface';

export interface IDashboardService {
  getStats(): Promise<DashboardStats>;
  getChartData(): Promise<DashboardChartData>;
}
