import { Injectable, Logger } from '@nestjs/common';
import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { GetObjectCommand } from '@aws-sdk/client-s3';

@Injectable()
export class StorageService {
  private readonly logger = new Logger(StorageService.name);
  private readonly s3: S3Client | null;
  private readonly bucket: string;

  constructor() {
    const endpoint = process.env.OCI_S3_ENDPOINT;
    const region = process.env.OCI_S3_REGION;
    const accessKeyId = process.env.OCI_S3_ACCESS_KEY;
    const secretAccessKey = process.env.OCI_S3_SECRET_KEY;
    this.bucket = process.env.OCI_S3_BUCKET || 'orthomonitor-scans';

    if (endpoint && accessKeyId && secretAccessKey) {
      this.s3 = new S3Client({
        endpoint,
        region: region || 'eu-frankfurt-1',
        credentials: { accessKeyId, secretAccessKey },
        forcePathStyle: true,
      });
      this.logger.log(`S3-compatible storage configured (endpoint: ${endpoint})`);
    } else {
      this.s3 = null;
      this.logger.warn('OCI_S3_ENDPOINT not set — using local filesystem fallback');
    }
  }

  isCloudEnabled(): boolean {
    return this.s3 !== null;
  }

  buildKey(sessionId: string, imageType: string, ext: string): string {
    return `scans/${sessionId}/${imageType}-${Date.now()}.${ext}`;
  }

  async generateUploadUrl(
    key: string,
    contentType: string,
  ): Promise<string> {
    if (!this.s3) {
      throw new Error('Cloud storage is not configured');
    }
    const command = new PutObjectCommand({
      Bucket: this.bucket,
      Key: key,
      ContentType: contentType,
    });
    return getSignedUrl(this.s3, command, { expiresIn: 900 }); // 15 min
  }

  async generateDownloadUrl(key: string): Promise<string> {
    if (!this.s3) {
      throw new Error('Cloud storage is not configured');
    }
    const command = new GetObjectCommand({
      Bucket: this.bucket,
      Key: key,
    });
    return getSignedUrl(this.s3, command, { expiresIn: 3600 }); // 1 hour
  }

  async putObject(
    key: string,
    body: Buffer,
    contentType: string,
  ): Promise<void> {
    if (!this.s3) {
      throw new Error('Cloud storage is not configured');
    }
    await this.s3.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        Body: body,
        ContentType: contentType,
      }),
    );
  }

  async deleteObject(key: string): Promise<void> {
    if (!this.s3) {
      throw new Error('Cloud storage is not configured');
    }
    await this.s3.send(
      new DeleteObjectCommand({
        Bucket: this.bucket,
        Key: key,
      }),
    );
  }
}
