import type { File } from "@domain/entities/File";

export type UploadFileInput = {
  userId: string;
  recordId: string;
  fileUri: string;
  mimeType?: string;
  fileName?: string;
};

export type ListByRecordInput = {
  userId: string;
  recordId: string;
};

export type GetDownloadUrlInput = ListByRecordInput;

export interface FileRepository {
  upload(input: UploadFileInput): Promise<File>;
  listByRecord(userId: string, recordId: string): Promise<File[]>;
  delete(input: File): Promise<void>;
  getDownloadUrl(input: File): Promise<string>;
}
