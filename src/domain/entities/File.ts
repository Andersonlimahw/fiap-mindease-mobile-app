export interface File {
  id: string;
  userId: string;
  recordId: string;
  downloadUrl: string;
  sizeInBytes: number;
  mimeType: string;
  createdAt: number;
}
