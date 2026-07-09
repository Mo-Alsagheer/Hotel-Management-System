import { CreateCarDto } from '../dtos/create-car.dto';
import { UpdateCarDto } from '../dtos/update-car.dto';
import { CarQueryDto } from '../dtos/car-query.dto';
import { Car } from '../schemas/car.schema';
import { PaginatedResponse } from '../../../common/interfaces/paginated-response.interface';

export abstract class CarService {
  abstract create(
    createCarDto: CreateCarDto,
    imagePaths: string[],
  ): Promise<Car>;

  abstract findAll(dto: CarQueryDto): Promise<PaginatedResponse<Car>>;

  abstract findOne(id: string): Promise<Car>;

  abstract findAvailable(dto: CarQueryDto): Promise<PaginatedResponse<Car>>;

  abstract update(
    id: string,
    updateCarDto: UpdateCarDto,
    newImagePaths?: string[],
  ): Promise<Car>;

  abstract delete(id: string): Promise<{ message: string }>;

  abstract removeImage(
    id: string,
    imageName: string,
  ): Promise<{ message: string }>;
}
