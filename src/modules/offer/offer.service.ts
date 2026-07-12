import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Offer, OfferDocument } from './schemas/offer.schema';
import { CreateOfferDto } from './dtos/create-offer.dto';
import { UpdateOfferDto } from './dtos/update-offer.dto';
import { PaginatedResponse } from '../../common/interfaces/paginated-response.interface';
import { FileStorageService } from '../file-storage/file-storage.service';
import { IOfferService } from './interfaces/offer-service.interface';

@Injectable()
export class OfferService implements IOfferService {
  constructor(
    @InjectModel(Offer.name) private offerModel: Model<OfferDocument>,
    private readonly fileStorageService: FileStorageService,
  ) {}

  async create(
    createOfferDto: CreateOfferDto,
    imagePath?: string,
  ): Promise<Offer> {
    try {
      const { roomId, ...rest } = createOfferDto;
      const offerData = {
        ...rest,
        roomId: roomId ? new Types.ObjectId(roomId) : undefined,
        image: imagePath,
      };
      const createdOffer = new this.offerModel(offerData);
      return await createdOffer.save();
    } catch (error) {
      if (imagePath) {
        this.fileStorageService.deleteFile(imagePath);
      }
      throw error;
    }
  }

  async findAll(page = 1, limit = 10): Promise<PaginatedResponse<Offer>> {
    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      this.offerModel
        .find()
        .populate('roomId')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean()
        .exec(),
      this.offerModel.countDocuments().exec(),
    ]);

    const totalPages = Math.ceil(total / limit);

    return {
      data: data as Offer[],
      total,
      page,
      limit,
      totalPages,
    };
  }

  async findOne(id: string): Promise<Offer> {
    const offer = await this.offerModel
      .findById(id)
      .populate('roomId')
      .lean()
      .exec();
    if (!offer) {
      throw new NotFoundException(`Offer with ID "${id}" not found`);
    }
    return offer as Offer;
  }

  async update(
    id: string,
    updateOfferDto: UpdateOfferDto,
    newImagePath?: string,
  ): Promise<Offer> {
    const offer = await this.offerModel.findById(id).exec();
    if (!offer) {
      if (newImagePath) {
        this.fileStorageService.deleteFile(newImagePath);
      }
      throw new NotFoundException(`Offer with ID "${id}" not found`);
    }

    const oldImagePath = offer.image;

    try {
      const { roomId, ...rest } = updateOfferDto;
      const updateData: Partial<Offer> = {
        ...rest,
        roomId: roomId ? new Types.ObjectId(roomId) : undefined,
      };
      if (newImagePath) {
        updateData.image = newImagePath;
      }

      const updatedOffer = await this.offerModel
        .findByIdAndUpdate(id, updateData, { new: true, runValidators: true })
        .exec();

      if (!updatedOffer) {
        throw new NotFoundException(`Offer with ID "${id}" not found`);
      }

      if (newImagePath && oldImagePath) {
        this.fileStorageService.deleteFile(oldImagePath);
      }

      return updatedOffer;
    } catch (error) {
      if (newImagePath) {
        this.fileStorageService.deleteFile(newImagePath);
      }
      throw error;
    }
  }

  async delete(id: string): Promise<Offer> {
    const offer = await this.offerModel.findByIdAndDelete(id).exec();
    if (!offer) {
      throw new NotFoundException(`Offer with ID "${id}" not found`);
    }

    if (offer.image) {
      this.fileStorageService.deleteFile(offer.image);
    }

    return offer;
  }
}
