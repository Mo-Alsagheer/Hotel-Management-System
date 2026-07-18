import { Injectable } from '@nestjs/common';
import { FileStorageService } from '../../file-storage/file-storage.service';
import { IRoomImageService } from '../interfaces/room-image-service.interface';

@Injectable()
export class RoomImageService implements IRoomImageService {
  constructor(private readonly fileStorageService: FileStorageService) {}

  cleanupFiles(filePaths: string[]): void {
    this.fileStorageService.deleteFiles(filePaths);
  }

  deleteImageFile(filePath: string): void {
    this.fileStorageService.deleteFile(filePath);
  }
}
