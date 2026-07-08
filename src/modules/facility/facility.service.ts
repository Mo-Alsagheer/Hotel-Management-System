import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Facility, FacilityDocument } from './schemas/facility.schema';
import { CreateFacilityDto } from './dtos/create-facility.dto';
import { UpdateFacilityDto } from './dtos/update-facility.dto';
import { PaginatedResponse } from '../../common/interfaces/paginated-response.interface';
import { FacilityService } from './interfaces/facility-service.interface';

@Injectable()
export class MongooseFacilityService extends FacilityService {
  constructor(
    @InjectModel(Facility.name) private facilityModel: Model<FacilityDocument>,
  ) {
    super();
  }

  async create(createFacilityDto: CreateFacilityDto): Promise<Facility> {
    try {
      const createdFacility = new this.facilityModel(createFacilityDto);
      return await createdFacility.save();
    } catch (error) {
      if ((error as { code?: number }).code === 11000) {
        throw new ConflictException(
          `Facility with name "${createFacilityDto.name}" already exists`,
        );
      }
      throw error;
    }
  }

  async findAll(page = 1, limit = 10): Promise<PaginatedResponse<Facility>> {
    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      this.facilityModel.find().skip(skip).limit(limit).lean().exec(),
      this.facilityModel.countDocuments().exec(),
    ]);

    const totalPages = Math.ceil(total / limit);

    return {
      data: data as Facility[],
      total,
      page,
      limit,
      totalPages,
    };
  }

  async findOne(id: string): Promise<Facility> {
    const facility = await this.facilityModel.findById(id).lean().exec();
    if (!facility) {
      throw new NotFoundException(`Facility with ID "${id}" not found`);
    }
    return facility as Facility;
  }

  async update(
    id: string,
    updateFacilityDto: UpdateFacilityDto,
  ): Promise<Facility> {
    try {
      const updatedFacility = await this.facilityModel
        .findByIdAndUpdate(id, updateFacilityDto, {
          new: true,
          runValidators: true,
        })
        .exec();

      if (!updatedFacility) {
        throw new NotFoundException(`Facility with ID "${id}" not found`);
      }
      return updatedFacility;
    } catch (error) {
      if ((error as { code?: number }).code === 11000) {
        throw new ConflictException(
          `Facility with name "${updateFacilityDto.name}" already exists`,
        );
      }
      throw error;
    }
  }

  async delete(id: string): Promise<Facility> {
    const deletedFacility = await this.facilityModel
      .findByIdAndDelete(id)
      .exec();
    if (!deletedFacility) {
      throw new NotFoundException(`Facility with ID "${id}" not found`);
    }
    return deletedFacility;
  }

  async validateFacilitiesExist(ids: string[]): Promise<boolean> {
    if (!ids || ids.length === 0) return true;
    const count = await this.facilityModel
      .countDocuments({ _id: { $in: ids } })
      .exec();
    return count === ids.length;
  }
}
