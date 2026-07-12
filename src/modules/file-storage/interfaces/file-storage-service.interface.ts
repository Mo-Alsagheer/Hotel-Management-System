export interface IFileStorageService {
  deleteFile(filePath: string): void;
  deleteFiles(filePaths: string[]): void;
}
