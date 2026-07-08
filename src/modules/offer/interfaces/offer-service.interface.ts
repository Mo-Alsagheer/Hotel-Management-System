import { Offer } from '../schemas/offer.schema';
import { CreateOfferDto } from '../dtos/create-offer.dto';
import { UpdateOfferDto } from '../dtos/update-offer.dto';
import { PaginatedResponse } from '../../../common/interfaces/paginated-response.interface';

export abstract class OfferService {
  abstract create(
    createOfferDto: CreateOfferDto,
    imagePath?: string,
  ): Promise<Offer>;

  abstract findAll(
    page?: number,
    limit?: number,
  ): Promise<PaginatedResponse<Offer>>;

  abstract findOne(id: string): Promise<Offer>;

  abstract update(
    id: string,
    updateOfferDto: UpdateOfferDto,
    newImagePath?: string,
  ): Promise<Offer>;

  abstract delete(id: string): Promise<Offer>;
}
