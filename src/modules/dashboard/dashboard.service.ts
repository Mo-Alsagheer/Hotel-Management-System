import { Injectable, Inject } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';
import { Room, RoomDocument } from '../room/schemas/room.schema';
import { User, UserDocument, UserRole } from '../user/schemas/user.schema';
import {
  Booking,
  BookingDocument,
  BookingStatus,
} from '../booking/schemas/booking.schema';
import {
  DashboardStats,
  DashboardChartData,
} from './interfaces/dashboard.interface';

@Injectable()
export class DashboardService {
  constructor(
    @InjectModel(Room.name) private roomModel: Model<RoomDocument>,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel(Booking.name) private bookingModel: Model<BookingDocument>,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {}

  async getStats(): Promise<DashboardStats> {
    const cacheKey = 'dashboard:stats';
    const cachedData = (await this.cacheManager.get(
      cacheKey,
    )) as DashboardStats | null;
    // check in-memory cache first and return the cached data if found
    if (cachedData) {
      return cachedData;
    }

    const today = new Date();

    // 1. Total Rooms (excluding soft deleted)
    const totalRooms = await this.roomModel
      .countDocuments({ isDeleted: false })
      .exec();

    // 2. Occupied Rooms (rooms with confirmed or pending bookings today)
    const occupiedStats = (await this.bookingModel
      .aggregate([
        {
          $match: {
            status: { $in: [BookingStatus.CONFIRMED, BookingStatus.PENDING] },
            checkIn: { $lte: today },
            checkOut: { $gte: today },
          },
        },
        {
          $group: {
            _id: '$roomId',
          },
        },
        {
          $count: 'count',
        },
      ])
      .exec()) as Array<{ count?: number }>;

    const occupiedRooms = occupiedStats[0]?.count || 0;

    // 3. Available Rooms
    const availableRooms = Math.max(0, totalRooms - occupiedRooms);

    // 4. Total Users (with role = 'user')
    const totalUsers = await this.userModel
      .countDocuments({ role: UserRole.USER })
      .exec();

    // 5. Bookings status breakdown (using Aggregation Pipeline)
    const bookingStats = (await this.bookingModel
      .aggregate([
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 },
          },
        },
      ])
      .exec()) as Array<{ _id: BookingStatus; count: number }>;

    const bookingStatusBreakdown: Record<BookingStatus, number> = {
      [BookingStatus.PENDING]: 0,
      [BookingStatus.CONFIRMED]: 0,
      [BookingStatus.CANCELLED]: 0,
      [BookingStatus.COMPLETED]: 0,
    };

    bookingStats.forEach((stat) => {
      if (stat._id in bookingStatusBreakdown) {
        bookingStatusBreakdown[stat._id] = stat.count;
      }
    });

    // 6. Total Revenue (sum of confirmed & completed bookings using Aggregation Pipeline)
    const revenueStats = (await this.bookingModel
      .aggregate([
        {
          $match: {
            status: { $in: [BookingStatus.CONFIRMED, BookingStatus.COMPLETED] },
          },
        },
        {
          $group: {
            _id: null,
            total: { $sum: '$totalPrice' },
          },
        },
      ])
      .exec()) as Array<{ total?: number }>;

    const totalRevenue = revenueStats[0]?.total || 0;

    // 7. Recent Bookings (last 10 bookings)
    const recentBookings = await this.bookingModel
      .find()
      .sort({ createdAt: -1 })
      .limit(10)
      .populate('userId', 'name email')
      .populate('roomId', 'roomNumber price')
      .exec();

    const result = {
      rooms: {
        total: totalRooms,
        available: availableRooms,
        occupied: occupiedRooms,
      },
      users: {
        totalRegistered: totalUsers,
      },
      bookings: {
        breakdown: bookingStatusBreakdown,
        recent: recentBookings,
      },
      revenue: {
        total: totalRevenue,
      },
    };

    await this.cacheManager.set(cacheKey, result, 300000); // cache for 5 minutes
    return result;
  }

  async getChartData(): Promise<DashboardChartData> {
    const cacheKey = 'dashboard:charts';
    const cachedData = (await this.cacheManager.get(
      cacheKey,
    )) as DashboardChartData | null;
    // check in-memory cache first and return the cached data if found
    if (cachedData) {
      return cachedData;
    }

    // 1. Users registrations over time (monthly)
    const usersChart = (await this.userModel
      .aggregate([
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m', date: '$createdAt' } },
            registrations: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
      ])
      .exec()) as Array<{ _id: string; registrations: number }>;

    // 2. Profit over time (monthly revenue of confirmed/completed bookings)
    const profitChart = (await this.bookingModel
      .aggregate([
        {
          $match: {
            status: { $in: [BookingStatus.CONFIRMED, BookingStatus.COMPLETED] },
          },
        },
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m', date: '$createdAt' } },
            revenue: { $sum: '$totalPrice' },
          },
        },
        { $sort: { _id: 1 } },
      ])
      .exec()) as Array<{ _id: string; revenue: number }>;

    // 3. Rooms available vs occupied over time (monthly booking metrics)
    const roomsChart = (await this.bookingModel
      .aggregate([
        {
          $match: {
            status: {
              $in: [
                BookingStatus.CONFIRMED,
                BookingStatus.COMPLETED,
                BookingStatus.PENDING,
              ],
            },
          },
        },
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m', date: '$createdAt' } },
            bookingsCount: { $sum: 1 },
            uniqueRoomsBooked: { $addToSet: '$roomId' },
          },
        },
        {
          $project: {
            _id: 1,
            bookingsCount: 1,
            occupiedRooms: { $size: '$uniqueRoomsBooked' },
          },
        },
        { $sort: { _id: 1 } },
      ])
      .exec()) as Array<{
      _id: string;
      bookingsCount: number;
      occupiedRooms: number;
    }>;

    const result = {
      usersRegistration: usersChart.map((item) => ({
        month: item._id,
        registrations: item.registrations,
      })),
      revenueProfit: profitChart.map((item) => ({
        month: item._id,
        revenue: item.revenue,
      })),
      roomsOccupancy: roomsChart.map((item) => ({
        month: item._id,
        bookingsCount: item.bookingsCount,
        occupiedRooms: item.occupiedRooms,
      })),
    };

    await this.cacheManager.set(cacheKey, result, 300000); // cache for 5 minutes
    return result;
  }
}
