import path from 'path';
import fs from 'fs';
import { env } from '../config/env.js';

export interface FileStorageResult {
  fileUrl: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
}

export class StorageService {
  /**
   * Save a buffer or file to configured storage (Local / S3 ready)
   */
  static async saveFile(
    buffer: Buffer,
    filename: string,
    subfolder = 'documents',
    mimeType = 'application/octet-stream'
  ): Promise<FileStorageResult> {
    const uploadDir = path.resolve(process.cwd(), env.UPLOAD_DIR, subfolder);
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    const uniqueFilename = `${Date.now()}-${filename.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
    const filePath = path.join(uploadDir, uniqueFilename);

    await fs.promises.writeFile(filePath, buffer);

    const fileUrl = `/uploads/${subfolder}/${uniqueFilename}`;

    return {
      fileUrl,
      fileName: filename,
      fileSize: buffer.length,
      mimeType
    };
  }

  /**
   * Delete a file from storage
   */
  static async deleteFile(relativeUrl: string): Promise<boolean> {
    try {
      if (!relativeUrl.startsWith('/uploads/')) return false;
      const cleanPath = relativeUrl.replace('/uploads/', '');
      const fullPath = path.resolve(process.cwd(), env.UPLOAD_DIR, cleanPath);
      if (fs.existsSync(fullPath)) {
        await fs.promises.unlink(fullPath);
        return true;
      }
      return false;
    } catch {
      return false;
    }
  }
}
