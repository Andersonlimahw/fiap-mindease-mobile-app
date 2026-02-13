import { File } from "@app/domain/entities/File";
import {
  FileRepository,
  UploadFileInput,
} from "@app/domain/repositories/FileRepository";

export class MockFileRepository implements FileRepository {
  private file: File = {
    id: "1",
    userId: "1",
    recordId: "1",
    downloadUrl: "https://www.google.com",
    sizeInBytes: 0,
    mimeType: "",
    createdAt: 0,
  };
  upload(input: UploadFileInput): Promise<File> {
    return Promise.resolve(this.file);
  }
  listByRecord(userId: string, recordId: string): Promise<File[]> {
    return Promise.resolve([this.file]);
  }
  delete(file: File): Promise<void> {
    this.file = null as any;
    return Promise.resolve();
  }
  getDownloadUrl(file: File): Promise<string> {
    return Promise.resolve(this.file.downloadUrl);
  }
}
