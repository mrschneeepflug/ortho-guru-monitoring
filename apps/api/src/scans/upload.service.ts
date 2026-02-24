import { Injectable, NotFoundException } from '@nestjs/common';
import { ImageType } from '@prisma/client';
import { PrismaService } from '../common/prisma/prisma.service';
import * as path from 'path';
import * as fs from 'fs';

@Injectable()
export class UploadService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Generate a presigned upload URL for a scan image.
   * TODO: Replace with S3 integration
   */
  async generateUploadUrl(sessionId: string, imageType: ImageType, practiceId: string) {
    // Verify the session exists and belongs to the practice
    const session = await this.prisma.scanSession.findFirst({
      where: { id: sessionId, patient: { practiceId } },
      include: { patient: true },
    });

    if (!session) {
      throw new NotFoundException(
        `Scan session with ID "${sessionId}" not found`,
      );
    }

    const key = `local-key-${sessionId}-${imageType}-${Date.now()}`;

    // TODO: Replace with S3 presigned URL
    return {
      url: `/uploads/${key}`,
      key,
    };
  }

  /**
   * Handle a local file upload for a scan image.
   * Saves the file to the uploads/ directory, creates a ScanImage record,
   * and increments the session imageCount.
   * TODO: Replace with S3 integration
   */
  async handleLocalUpload(
    sessionId: string,
    imageType: ImageType,
    file: Express.Multer.File,
    practiceId: string,
  ) {
    // Verify the session exists and belongs to the practice
    const session = await this.prisma.scanSession.findFirst({
      where: { id: sessionId, patient: { practiceId } },
      include: { patient: true },
    });

    if (!session) {
      throw new NotFoundException(
        `Scan session with ID "${sessionId}" not found`,
      );
    }

    // Ensure the uploads directory exists
    const uploadsDir = path.resolve(process.cwd(), 'uploads');
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    // Build a unique filename and save to disk
    const ext = path.extname(file.originalname) || '.jpg';
    const filename = `${sessionId}-${imageType}-${Date.now()}${ext}`;
    const filePath = path.join(uploadsDir, filename);
    fs.writeFileSync(filePath, file.buffer);

    // Create the ScanImage record and increment the session imageCount
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
}
