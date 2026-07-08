import { Injectable, mixin, NestInterceptor, Type } from '@nestjs/common';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import * as fs from 'fs';

interface LocalFilesInterceptorOptions {
  fieldName: string;
  maxCount?: number;
  path: string;
  type?: 'single' | 'multiple';
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
    storage: diskStorage({
      destination: uploadDir,
      filename: (req, file, callback) => {
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
