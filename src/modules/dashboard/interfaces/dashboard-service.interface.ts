import { DashboardStats, DashboardChartData } from './dashboard.interface';

export abstract class DashboardService {
  abstract getStats(): Promise<DashboardStats>;

  abstract getChartData(): Promise<DashboardChartData>;
}
