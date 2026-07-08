import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Offer, OfferSchema } from './schemas/offer.schema';
import { OfferController } from './offer.controller';

// Concrete implementation
import { MongooseOfferService } from './offer.service';

// Abstract contract
import { OfferService } from './interfaces/offer-service.interface';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Offer.name, schema: OfferSchema }]),
  ],
  controllers: [OfferController],
  providers: [{ provide: OfferService, useClass: MongooseOfferService }],
  exports: [OfferService],
})
export class OfferModule {}
