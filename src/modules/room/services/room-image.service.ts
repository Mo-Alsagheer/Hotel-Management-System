import { Injectable } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import { RoomImageService } from '../interfaces/room-image-service.interface';

@Injectable()
export class LocalRoomImageService extends RoomImageService {
  constructor() {
    super();
  }

  cleanupFiles(filePaths: string[]): void {
    if (!filePaths || filePaths.length === 0) return;
    filePaths.forEach((fp) => {
      this.deleteImageFile(fp);
    });
  }

  deleteImageFile(filePath: string): void {
    if (!filePath) return;
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
