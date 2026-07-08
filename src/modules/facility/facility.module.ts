import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Facility, FacilitySchema } from './schemas/facility.schema';
import { FacilityController } from './facility.controller';

// Concrete implementation
import { MongooseFacilityService } from './facility.service';

// Abstract contract
import { FacilityService } from './interfaces/facility-service.interface';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Facility.name, schema: FacilitySchema },
    ]),
  ],
  controllers: [FacilityController],
  providers: [{ provide: FacilityService, useClass: MongooseFacilityService }],
  exports: [FacilityService],
})
export class FacilityModule {}
