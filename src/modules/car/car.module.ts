import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Car, CarSchema } from './schemas/car.schema';
import { CarController } from './car.controller';

// Concrete implementations
import { MongooseCarService } from './services/car.service';
import { LocalCarImageService } from './services/car-image.service';

// Abstract class contracts
import { CarService } from './interfaces/car-service.interface';
import { CarImageService } from './interfaces/car-image-service.interface';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Car.name, schema: CarSchema }]),
  ],
  controllers: [CarController],
  providers: [
    { provide: CarService, useClass: MongooseCarService },
    { provide: CarImageService, useClass: LocalCarImageService },
  ],
  exports: [CarService, CarImageService],
})
export class CarModule {}
