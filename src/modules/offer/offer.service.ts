import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Offer, OfferDocument } from './schemas/offer.schema';
import { CreateOfferDto } from './dtos/create-offer.dto';
import { UpdateOfferDto } from './dtos/update-offer.dto';
import { PaginatedResponse } from '../../common/interfaces/paginated-response.interface';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class OfferService {
  constructor(
    @InjectModel(Offer.name) private offerModel: Model<OfferDocument>,
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
        this.cleanupFile(imagePath);
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
        .exec(),
      this.offerModel.countDocuments().exec(),
    ]);

    const totalPages = Math.ceil(total / limit);

    return {
      data,
      total,
      page,
      limit,
      totalPages,
    };
  }

  async findOne(id: string): Promise<Offer> {
    const offer = await this.offerModel.findById(id).populate('roomId').exec();
    if (!offer) {
      throw new NotFoundException(`Offer with ID "${id}" not found`);
    }
    return offer;
  }

  async update(
    id: string,
    updateOfferDto: UpdateOfferDto,
    newImagePath?: string,
  ): Promise<Offer> {
    const offer = await this.offerModel.findById(id).exec();
    if (!offer) {
      if (newImagePath) {
        this.cleanupFile(newImagePath);
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
        this.cleanupFile(oldImagePath);
      }

      return updatedOffer;
    } catch (error) {
      if (newImagePath) {
        this.cleanupFile(newImagePath);
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
      this.cleanupFile(offer.image);
    }

    return offer;
  }

  private cleanupFile(filePath: string) {
    try {
      const fullPath = path.join(__dirname, '../../..', filePath);
      if (fs.existsSync(fullPath)) {
        fs.unlinkSync(fullPath);
      }
    } catch (error: unknown) {
      console.error('Error cleaning up file:', error);
    }
  }
}
