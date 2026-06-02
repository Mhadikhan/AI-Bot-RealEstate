import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { randomUUID } from "crypto";

export type StorageUploadInput = {
  buffer: Buffer;
  fileName: string;
  mimeType: string;
  folder?: string;
};

export interface StorageProvider {
  upload(input: StorageUploadInput): Promise<{ url: string; fileName: string }>;
}

export class LocalStorageProvider implements StorageProvider {
  async upload(input: StorageUploadInput) {
    const folder = input.folder || "uploads/properties";
    const dir = path.join(process.cwd(), "public", folder);
    await mkdir(dir, { recursive: true });
    const ext = path.extname(input.fileName) || "";
    const safeName = `${randomUUID()}${ext}`;
    const filePath = path.join(dir, safeName);
    await writeFile(filePath, input.buffer);
    return { url: `/${folder}/${safeName}`, fileName: safeName };
  }
}

export function createStorageProvider(): StorageProvider {
  const provider = (process.env.STORAGE_PROVIDER || "local").toLowerCase();
  if (provider === "local") return new LocalStorageProvider();
  // Cloudinary / S3 / R2 adapters can be added here without changing callers.
  return new LocalStorageProvider();
}
