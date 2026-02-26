import { Injectable, NotFoundException } from '@nestjs/common';
import { ImageType } from '@prisma/client';
import { PrismaService } from '../common/prisma/prisma.service';
import { StorageService } from '../common/storage/storage.service';
import * as path from 'path';
import * as fs from 'fs';

@Injectable()
export class UploadService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: StorageService,
  ) {}

  /**
   * Generate a presigned upload URL for a scan image.
   * When OCI is configured, returns a real pre-signed PUT URL.
   * Otherwise falls back to a local path stub.
   */
  async generateUploadUrl(sessionId: string, imageType: ImageType, practiceId: string) {
    const session = await this.findSession(sessionId, practiceId);
    if (!session) {
      throw new NotFoundException(
        `Scan session with ID "${sessionId}" not found`,
      );
    }

    const ext = 'jpg';
    const key = this.storage.buildKey(sessionId, imageType, ext);

    if (this.storage.isCloudEnabled()) {
      const url = await this.storage.generateUploadUrl(key, `image/${ext}`);
      return { url, key };
    }

    // Local fallback
    return {
      url: `/uploads/${key}`,
      key,
    };
  }

  /**
   * Confirm an upload that was done directly to object storage via pre-signed URL.
   * Creates the ScanImage record and increments imageCount.
   */
  async confirmUpload(
    sessionId: string,
    imageType: ImageType,
    key: string,
    practiceId: string,
  ) {
    const session = await this.findSession(sessionId, practiceId);
    if (!session) {
      throw new NotFoundException(
        `Scan session with ID "${sessionId}" not found`,
      );
    }

    const [scanImage] = await this.prisma.$transaction([
      this.prisma.scanImage.create({
        data: {
          sessionId,
          imageType,
          s3Key: key,
        },
      }),
      this.prisma.scanSession.update({
        where: { id: sessionId },
        data: { imageCount: { increment: 1 } },
      }),
    ]);

    return scanImage;
  }

  /**
   * Handle a local file upload for a scan image.
   * When OCI is configured, uploads the buffer via S3 putObject.
   * Otherwise saves to the local filesystem.
   */
  async handleLocalUpload(
    sessionId: string,
    imageType: ImageType,
    file: Express.Multer.File,
    practiceId: string,
  ) {
    const session = await this.findSession(sessionId, practiceId);
    if (!session) {
      throw new NotFoundException(
        `Scan session with ID "${sessionId}" not found`,
      );
    }

    const ext = (path.extname(file.originalname) || '.jpg').replace('.', '');
    const key = this.storage.buildKey(sessionId, imageType, ext);

    if (this.storage.isCloudEnabled()) {
      await this.storage.putObject(key, file.buffer, file.mimetype || `image/${ext}`);

      const [scanImage] = await this.prisma.$transaction([
        this.prisma.scanImage.create({
          data: {
            sessionId,
            imageType,
            s3Key: key,
          },
        }),
        this.prisma.scanSession.update({
          where: { id: sessionId },
          data: { imageCount: { increment: 1 } },
        }),
      ]);

      return scanImage;
    }

    // Local filesystem fallback
    const uploadsDir = path.resolve(process.cwd(), 'uploads');
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    const filename = `${sessionId}-${imageType}-${Date.now()}.${ext}`;
    const filePath = path.join(uploadsDir, filename);
    fs.writeFileSync(filePath, file.buffer);

    const [scanImage] = await this.prisma.$transaction([
      this.prisma.scanImage.create({
        data: {
          sessionId,
          imageType,
          localPath: filePath,
        },
      }),
      this.prisma.scanSession.update({
        where: { id: sessionId },
        data: { imageCount: { increment: 1 } },
      }),
    ]);

    return scanImage;
  }

  /**
   * Get a pre-signed download URL for a scan image.
   * Returns the URL for cloud-stored images, or the local path.
   */
  async getImageUrl(imageId: string, practiceId: string) {
    const image = await this.prisma.scanImage.findFirst({
      where: {
        id: imageId,
        session: { patient: { practiceId } },
      },
    });

    if (!image) {
      throw new NotFoundException(
        `Scan image with ID "${imageId}" not found`,
      );
    }

    if (image.s3Key && this.storage.isCloudEnabled()) {
      const url = await this.storage.generateDownloadUrl(image.s3Key);
      return { url };
    }

    return { url: image.localPath || null };
  }

  private async findSession(sessionId: string, practiceId: string) {
    return this.prisma.scanSession.findFirst({
      where: { id: sessionId, patient: { practiceId } },
      include: { patient: true },
    });
  }
}
