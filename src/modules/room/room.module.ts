import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Room, RoomSchema } from './schemas/room.schema';
import { RoomController } from './room.controller';
import { FacilityModule } from '../facility/facility.module';
import { Booking, BookingSchema } from '../booking/schemas/booking.schema';
import { Review, ReviewSchema } from '../review/schemas/review.schema';
import { RoomService } from './services/room.service';
import { RoomImageService } from './services/room-image.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Room.name, schema: RoomSchema },
      { name: Booking.name, schema: BookingSchema },
      { name: Review.name, schema: ReviewSchema },
    ]),
    FacilityModule,
  ],
  controllers: [RoomController],
  providers: [RoomService, RoomImageService],
  exports: [RoomService, RoomImageService],
})
export class RoomModule {}
