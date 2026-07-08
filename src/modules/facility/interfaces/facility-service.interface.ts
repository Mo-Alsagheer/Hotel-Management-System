import { Facility } from '../schemas/facility.schema';
import { CreateFacilityDto } from '../dtos/create-facility.dto';
import { UpdateFacilityDto } from '../dtos/update-facility.dto';
import { PaginatedResponse } from '../../../common/interfaces/paginated-response.interface';

export abstract class FacilityService {
  abstract create(createFacilityDto: CreateFacilityDto): Promise<Facility>;

  abstract findAll(
    page?: number,
    limit?: number,
  ): Promise<PaginatedResponse<Facility>>;

  abstract findOne(id: string): Promise<Facility>;

  abstract update(
    id: string,
    updateFacilityDto: UpdateFacilityDto,
  ): Promise<Facility>;

  abstract delete(id: string): Promise<Facility>;

  abstract validateFacilitiesExist(ids: string[]): Promise<boolean>;
}
