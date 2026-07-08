import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Room, RoomSchema } from './schemas/room.schema';
import { RoomController } from './room.controller';
import { FacilityModule } from '../facility/facility.module';
import { Booking, BookingSchema } from '../booking/schemas/booking.schema';
import { Review, ReviewSchema } from '../review/schemas/review.schema';

// Concrete implementations
import { MongooseRoomService } from './services/room.service';
import { MongooseRoomAvailabilityService } from './services/room-availability.service';
import { LocalRoomImageService } from './services/room-image.service';
import { MongooseRoomRatingService } from './services/room-rating.service';

// Abstract class contracts
import { RoomService } from './interfaces/room-service.interface';
import { RoomAvailabilityService } from './interfaces/room-availability-service.interface';
import { RoomImageService } from './interfaces/room-image-service.interface';
import { RoomRatingService } from './interfaces/room-rating-service.interface';

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
  providers: [
    { provide: RoomService, useClass: MongooseRoomService },
    {
      provide: RoomAvailabilityService,
      useClass: MongooseRoomAvailabilityService,
    },
    { provide: RoomImageService, useClass: LocalRoomImageService },
    { provide: RoomRatingService, useClass: MongooseRoomRatingService },
  ],
  exports: [
    RoomService,
    RoomAvailabilityService,
    RoomImageService,
    RoomRatingService,
  ],
})
export class RoomModule {}
