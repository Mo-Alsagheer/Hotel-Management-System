export abstract class CarImageService {
  abstract deleteImageFile(imagePath: string): void;
  abstract cleanupFiles(filePaths: string[]): void;
}
