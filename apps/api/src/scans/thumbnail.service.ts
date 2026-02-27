import { Injectable, Logger } from '@nestjs/common';
import sharp from 'sharp';
import * as path from 'path';
import * as fs from 'fs';
import { StorageService } from '../common/storage/storage.service';

@Injectable()
export class ThumbnailService {
  private readonly logger = new Logger(ThumbnailService.name);

  constructor(private readonly storage: StorageService) {}

  async generateThumbnail(buffer: Buffer): Promise<Buffer> {
    return sharp(buffer)
      .resize(300, 300, { fit: 'inside', withoutEnlargement: true })
      .webp({ quality: 75 })
      .toBuffer();
  }

  buildThumbnailKey(originalKey: string): string {
    const parsed = path.posix.parse(originalKey);
    return `${parsed.dir}/${parsed.name}-thumb.webp`;
  }

  async generateAndStoreCloud(originalKey: string): Promise<string | null> {
    try {
      const imageBuffer = await this.storage.getObject(originalKey);
      const thumbBuffer = await this.generateThumbnail(imageBuffer);
      const thumbnailKey = this.buildThumbnailKey(originalKey);
      await this.storage.putObject(thumbnailKey, thumbBuffer, 'image/webp');
      return thumbnailKey;
    } catch (error) {
      this.logger.warn(`Failed to generate cloud thumbnail for ${originalKey}: ${(error as Error).message}`);
      return null;
    }
  }

  async generateAndStoreFromBuffer(
    buffer: Buffer,
    s3Key: string | null,
    localPath: string | null,
  ): Promise<{ thumbnailKey: string | null }> {
    try {
      const thumbBuffer = await this.generateThumbnail(buffer);

      if (s3Key && this.storage.isCloudEnabled()) {
        const thumbnailKey = this.buildThumbnailKey(s3Key);
        await this.storage.putObject(thumbnailKey, thumbBuffer, 'image/webp');
        return { thumbnailKey };
      }

      if (localPath) {
        const parsed = path.parse(localPath);
        const thumbPath = path.join(parsed.dir, `${parsed.name}-thumb.webp`);
        fs.writeFileSync(thumbPath, thumbBuffer);
        return { thumbnailKey: thumbPath };
      }

      return { thumbnailKey: null };
    } catch (error) {
      this.logger.warn(`Failed to generate thumbnail from buffer: ${(error as Error).message}`);
      return { thumbnailKey: null };
    }
  }
}
