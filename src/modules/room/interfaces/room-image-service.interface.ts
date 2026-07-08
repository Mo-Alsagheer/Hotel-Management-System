export abstract class RoomImageService {
  abstract deleteImageFile(imagePath: string): void;
  abstract cleanupFiles(filePaths: string[]): void;
}
