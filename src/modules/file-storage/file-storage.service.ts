import { Injectable } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import { IFileStorageService } from './interfaces/file-storage-service.interface';

@Injectable()
export class FileStorageService implements IFileStorageService {
  deleteFile(filePath: string): void {
    if (!filePath) return;
    try {
      const fullPath = path.isAbsolute(filePath)
        ? filePath
        : path.join(process.cwd(), filePath);
      if (fs.existsSync(fullPath)) {
        fs.unlinkSync(fullPath);
      }
    } catch (error: unknown) {
      console.error(`Error deleting file at ${filePath}:`, error);
    }
  }

  deleteFiles(filePaths: string[]): void {
    if (!filePaths || filePaths.length === 0) return;
    filePaths.forEach((fp) => this.deleteFile(fp));
  }
}
