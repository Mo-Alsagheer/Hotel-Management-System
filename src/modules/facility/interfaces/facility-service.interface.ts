import { Facility } from '../schemas/facility.schema';
import { CreateFacilityDto } from '../dtos/create-facility.dto';
import { UpdateFacilityDto } from '../dtos/update-facility.dto';
import { PaginatedResponse } from '../../../common/interfaces/paginated-response.interface';

export interface IFacilityService {
  create(createFacilityDto: CreateFacilityDto): Promise<Facility>;
  findAll(page?: number, limit?: number): Promise<PaginatedResponse<Facility>>;
  findOne(id: string): Promise<Facility>;
  update(id: string, updateFacilityDto: UpdateFacilityDto): Promise<Facility>;
  delete(id: string): Promise<Facility>;
  validateFacilitiesExist(ids: string[]): Promise<void>;
}
