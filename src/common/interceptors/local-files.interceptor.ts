import {
  Injectable,
  mixin,
  NestInterceptor,
  Type,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { Request } from 'express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import * as fs from 'fs';

interface LocalFilesInterceptorOptions {
  fieldName: string;
  maxCount?: number;
  path: string;
  type?: 'single' | 'multiple';
  allowedMimeTypes?: string[];
  maxFileSize?: number;
}

export function LocalFilesInterceptor(
  options: LocalFilesInterceptorOptions,
): Type<NestInterceptor> {
  const uploadDir = options.path;

  // Ensure directory exists at boot/instantiation time
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }

  const multerOptions = {
    limits: {
      fileSize: options.maxFileSize || 5 * 1024 * 1024, // Default 5MB
    },
    fileFilter: (
      _req: Request,
      file: Express.Multer.File,
      callback: (error: Error | null, acceptFile: boolean) => void,
    ) => {
      if (
        options.allowedMimeTypes &&
        !options.allowedMimeTypes.includes(file.mimetype)
      ) {
        callback(
          new BadRequestException(
            `Unsupported file type: ${file.mimetype}. Allowed types: ${options.allowedMimeTypes.join(', ')}`,
          ),
          false,
        );
        return;
      }
      callback(null, true);
    },
    storage: diskStorage({
      destination: uploadDir,
      filename: (_req, file, callback) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
        callback(null, `${uniqueSuffix}${extname(file.originalname)}`);
      },
    }),
  };

  const BaseInterceptor =
    options.type === 'single'
      ? FileInterceptor(options.fieldName, multerOptions)
      : FilesInterceptor(
          options.fieldName,
          options.maxCount ?? 10,
          multerOptions,
        );

  @Injectable()
  class MixinInterceptor extends BaseInterceptor {}

  return mixin(MixinInterceptor);
}
