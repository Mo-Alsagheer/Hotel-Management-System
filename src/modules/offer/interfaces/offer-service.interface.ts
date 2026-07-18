import { Offer } from '../schemas/offer.schema';
import { CreateOfferDto } from '../dtos/create-offer.dto';
import { UpdateOfferDto } from '../dtos/update-offer.dto';
import { PaginatedResponse } from '../../../common/interfaces/paginated-response.interface';

export interface IOfferService {
  create(createOfferDto: CreateOfferDto, imagePath?: string): Promise<Offer>;
  findAll(page?: number, limit?: number): Promise<PaginatedResponse<Offer>>;
  findOne(id: string): Promise<Offer>;
  update(
    id: string,
    updateOfferDto: UpdateOfferDto,
    newImagePath?: string,
  ): Promise<Offer>;
  delete(id: string): Promise<Offer>;
}
