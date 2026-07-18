export interface IRoomImageService {
  cleanupFiles(filePaths: string[]): void;
  deleteImageFile(filePath: string): void;
}
