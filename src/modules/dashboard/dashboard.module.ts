import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { CacheModule } from '@nestjs/cache-manager';
import { DashboardController } from './dashboard.controller';
import { Room, RoomSchema } from '../room/schemas/room.schema';
import { User, UserSchema } from '../user/schemas/user.schema';
import { Booking, BookingSchema } from '../booking/schemas/booking.schema';

// Concrete implementation
import { MongooseDashboardService } from './dashboard.service';

// Abstract contract
import { DashboardService } from './interfaces/dashboard-service.interface';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Room.name, schema: RoomSchema },
      { name: User.name, schema: UserSchema },
      { name: Booking.name, schema: BookingSchema },
    ]),
    CacheModule.register({
      max: 100, // maximum number of items to store in the cache
    }),
  ],
  controllers: [DashboardController],
  providers: [
    { provide: DashboardService, useClass: MongooseDashboardService },
  ],
})
export class DashboardModule {}
