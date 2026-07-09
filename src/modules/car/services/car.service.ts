import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Car, CarDocument } from '../schemas/car.schema';
import { CreateCarDto } from '../dtos/create-car.dto';
import { UpdateCarDto } from '../dtos/update-car.dto';
import { CarQueryDto } from '../dtos/car-query.dto';
import { PaginatedResponse } from '../../../common/interfaces/paginated-response.interface';
import { CarService } from '../interfaces/car-service.interface';
import { CarImageService } from '../interfaces/car-image-service.interface';

@Injectable()
export class MongooseCarService extends CarService {
  constructor(
    @InjectModel(Car.name) private readonly carModel: Model<CarDocument>,
    private readonly carImageService: CarImageService,
  ) {
    super();
  }

  async create(
    createCarDto: CreateCarDto,
    imagePaths: string[] = [],
  ): Promise<Car> {
    try {
      const carData = {
        ...createCarDto,
        images: imagePaths,
      };

      const createdCar = new this.carModel(carData);
      return await createdCar.save();
    } catch (error) {
      // Clean up uploaded files if save fails
      this.carImageService.cleanupFiles(imagePaths);
      if ((error as { code?: number }).code === 11000) {
        throw new ConflictException(
          `Car with plate number "${createCarDto.plateNumber}" already exists`,
        );
      }
      throw error;
    }
  }

  async findAll(dto: CarQueryDto): Promise<PaginatedResponse<Car>> {
    const {
      page = 1,
      limit = 10,
      search,
      brand,
      transmission,
      fuelType,
      minPrice,
      maxPrice,
      seats,
    } = dto;

    const query: Record<string, unknown> = { isDeleted: false };

    if (search) {
      query.$or = [
        { model: { $regex: search, $options: 'i' } },
        { brand: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
      ];
    }

    if (brand) {
      query.brand = { $regex: brand, $options: 'i' };
    }

    if (transmission) {
      query.transmission = transmission;
    }

    if (fuelType) {
      query.fuelType = fuelType;
    }

    if (minPrice !== undefined || maxPrice !== undefined) {
      query.pricePerDay = {};
      if (minPrice !== undefined) {
        (query.pricePerDay as Record<string, number>).$gte = minPrice;
      }
      if (maxPrice !== undefined) {
        (query.pricePerDay as Record<string, number>).$lte = maxPrice;
      }
    }

    if (seats) {
      query.seats = { $gte: seats };
    }

    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      this.carModel.find(query).skip(skip).limit(limit).lean().exec(),
      this.carModel.countDocuments(query).exec(),
    ]);

    const totalPages = Math.ceil(total / limit);

    return {
      data: data,
      total,
      page,
      limit,
      totalPages,
    };
  }

  async findOne(id: string): Promise<Car> {
    const car = await this.carModel.findById(id).lean().exec();
    if (!car || car.isDeleted) {
      throw new NotFoundException(`Car with ID "${id}" not found`);
    }
    return car;
  }

  async findAvailable(dto: CarQueryDto): Promise<PaginatedResponse<Car>> {
    const {
      page = 1,
      limit = 10,
      search,
      brand,
      transmission,
      fuelType,
      minPrice,
      maxPrice,
      seats,
    } = dto;

    const query: Record<string, unknown> = { isDeleted: false, isAvailable: true };

    if (search) {
      query.$or = [
        { model: { $regex: search, $options: 'i' } },
        { brand: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
      ];
    }

    if (brand) {
      query.brand = { $regex: brand, $options: 'i' };
    }

    if (transmission) {
      query.transmission = transmission;
    }

    if (fuelType) {
      query.fuelType = fuelType;
    }

    if (minPrice !== undefined || maxPrice !== undefined) {
      query.pricePerDay = {};
      if (minPrice !== undefined) {
        (query.pricePerDay as Record<string, number>).$gte = minPrice;
      }
      if (maxPrice !== undefined) {
        (query.pricePerDay as Record<string, number>).$lte = maxPrice;
      }
    }

    if (seats) {
      query.seats = { $gte: seats };
    }

    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      this.carModel.find(query).skip(skip).limit(limit).lean().exec(),
      this.carModel.countDocuments(query).exec(),
    ]);

    const totalPages = Math.ceil(total / limit);

    return {
      data: data,
      total,
      page,
      limit,
      totalPages,
    };
  }

  async update(
    id: string,
    updateCarDto: UpdateCarDto,
    newImagePaths: string[] = [],
  ): Promise<Car> {
    const car = await this.carModel.findById(id).exec();
    if (!car || car.isDeleted) {
      this.carImageService.cleanupFiles(newImagePaths);
      throw new NotFoundException(`Car with ID "${id}" not found`);
    }

    try {
      const updatedImages = [...(car.images || []), ...newImagePaths];
      const updateData = {
        ...updateCarDto,
        images: updatedImages,
      };

      const updatedCar = await this.carModel
        .findByIdAndUpdate(id, updateData, { new: true, runValidators: true })
        .exec();

      if (!updatedCar) {
        throw new NotFoundException(`Car with ID "${id}" not found`);
      }
      return updatedCar;
    } catch (error) {
      this.carImageService.cleanupFiles(newImagePaths);
      if ((error as { code?: number }).code === 11000) {
        throw new ConflictException(
          `Car with plate number "${updateCarDto.plateNumber}" already exists`,
        );
      }
      throw error;
    }
  }

  async delete(id: string): Promise<{ message: string }> {
    const car = await this.carModel.findById(id).exec();
    if (!car || car.isDeleted) {
      throw new NotFoundException(`Car with ID "${id}" not found`);
    }

    car.isDeleted = true;
    await car.save();

    return { message: 'Car soft-deleted successfully' };
  }

  async removeImage(
    id: string,
    imageName: string,
  ): Promise<{ message: string }> {
    const car = await this.carModel.findById(id).exec();
    if (!car || car.isDeleted) {
      throw new NotFoundException(`Car with ID "${id}" not found`);
    }

    const imagePath = `/uploads/cars/${imageName}`;
    const images = car.images || [];
    const imageIndex = images.indexOf(imagePath);
    if (imageIndex === -1) {
      throw new NotFoundException(
        `Image "${imageName}" not found in this car`,
      );
    }

    // Remove from array and save
    images.splice(imageIndex, 1);
    car.images = images;
    await car.save();

    // Clean up from filesystem
    this.carImageService.deleteImageFile(imagePath);

    return { message: 'Car image deleted successfully' };
  }
}
