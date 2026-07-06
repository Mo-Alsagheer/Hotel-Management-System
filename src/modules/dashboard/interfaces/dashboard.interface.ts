import { Booking, BookingStatus } from '../../booking/schemas/booking.schema';

export interface DashboardStats {
  rooms: {
    total: number;
    available: number;
    occupied: number;
  };
  users: {
    totalRegistered: number;
  };
  bookings: {
    breakdown: Record<BookingStatus, number>;
    recent: Booking[];
  };
  revenue: {
    total: number;
  };
}

export interface DashboardChartData {
  usersRegistration: Array<{ month: string; registrations: number }>;
  revenueProfit: Array<{ month: string; revenue: number }>;
  roomsOccupancy: Array<{
    month: string;
    bookingsCount: number;
    occupiedRooms: number;
  }>;
}
