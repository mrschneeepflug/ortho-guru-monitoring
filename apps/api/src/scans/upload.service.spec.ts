import { Test } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { UploadService } from './upload.service';
import { PrismaService } from '../common/prisma/prisma.service';
import { StorageService } from '../common/storage/storage.service';
import { ThumbnailService } from './thumbnail.service';
import { createMockPrismaService, MockPrismaService } from '../test/prisma-mock.factory';

function createMockStorageService() {
  return {
    isCloudEnabled: jest.fn().mockReturnValue(false),
    buildKey: jest.fn().mockReturnValue('scans/s1/FRONT-123.jpg'),
    generateUploadUrl: jest.fn().mockResolvedValue('https://presigned-url.example.com'),
    generateDownloadUrl: jest.fn().mockResolvedValue('https://download-url.example.com'),
    putObject: jest.fn().mockResolvedValue(undefined),
    deleteObject: jest.fn().mockResolvedValue(undefined),
    getObject: jest.fn().mockResolvedValue(Buffer.from('image-data')),
  };
}

function createMockThumbnailService() {
  return {
    generateThumbnail: jest.fn().mockResolvedValue(Buffer.from('thumb-data')),
    buildThumbnailKey: jest.fn().mockReturnValue('scans/s1/FRONT-123-thumb.webp'),
    generateAndStoreCloud: jest.fn().mockResolvedValue('scans/s1/FRONT-123-thumb.webp'),
    generateAndStoreFromBuffer: jest.fn().mockResolvedValue({ thumbnailKey: 'scans/s1/FRONT-123-thumb.webp' }),
  };
}

describe('UploadService', () => {
  let service: UploadService;
  let prisma: MockPrismaService;
  let storage: ReturnType<typeof createMockStorageService>;
  let thumbnail: ReturnType<typeof createMockThumbnailService>;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        UploadService,
        { provide: PrismaService, useFactory: createMockPrismaService },
        { provide: StorageService, useFactory: createMockStorageService },
        { provide: ThumbnailService, useFactory: createMockThumbnailService },
      ],
    }).compile();

    service = module.get(UploadService);
    prisma = module.get(PrismaService) as unknown as MockPrismaService;
    storage = module.get(StorageService) as unknown as ReturnType<typeof createMockStorageService>;
    thumbnail = module.get(ThumbnailService) as unknown as ReturnType<typeof createMockThumbnailService>;
  });

  describe('generateUploadUrl', () => {
    it('should return local fallback URL when cloud is disabled', async () => {
      prisma.scanSession.findFirst.mockResolvedValueOnce({
        id: 's1',
        patient: { practiceId: 'p1' },
      });
      storage.isCloudEnabled.mockReturnValue(false);

      const result = await service.generateUploadUrl('s1', 'FRONT' as any, 'p1');

      expect(result.url).toContain('/uploads/');
      expect(result.key).toBe('scans/s1/FRONT-123.jpg');
    });

    it('should return pre-signed URL when cloud is enabled', async () => {
      prisma.scanSession.findFirst.mockResolvedValueOnce({
        id: 's1',
        patient: { practiceId: 'p1' },
      });
      storage.isCloudEnabled.mockReturnValue(true);

      const result = await service.generateUploadUrl('s1', 'FRONT' as any, 'p1');

      expect(result.url).toBe('https://presigned-url.example.com');
      expect(result.key).toBe('scans/s1/FRONT-123.jpg');
      expect(storage.generateUploadUrl).toHaveBeenCalledWith('scans/s1/FRONT-123.jpg', 'image/jpg');
    });

    it('should throw NotFoundException when session not found', async () => {
      prisma.scanSession.findFirst.mockResolvedValueOnce(null);

      await expect(service.generateUploadUrl('missing', 'FRONT' as any, 'p1'))
        .rejects.toThrow(NotFoundException);
    });

    it('should scope session lookup to practice', async () => {
      prisma.scanSession.findFirst.mockResolvedValueOnce({
        id: 's1',
        patient: { practiceId: 'p1' },
      });

      await service.generateUploadUrl('s1', 'LEFT' as any, 'p1');

      expect(prisma.scanSession.findFirst).toHaveBeenCalledWith({
        where: { id: 's1', patient: { practiceId: 'p1' } },
        include: { patient: true },
      });
    });
  });

  describe('confirmUpload', () => {
    it('should create a ScanImage record with s3Key and generate thumbnail', async () => {
      prisma.scanSession.findFirst.mockResolvedValueOnce({
        id: 's1',
        patient: { practiceId: 'p1' },
      });
      const mockImage = { id: 'img1', sessionId: 's1', s3Key: 'scans/s1/FRONT-123.jpg' };
      prisma.scanImage.create.mockResolvedValueOnce(mockImage);
      prisma.scanSession.update.mockResolvedValueOnce({});
      prisma.scanImage.update.mockResolvedValueOnce({ ...mockImage, thumbnailKey: 'scans/s1/FRONT-123-thumb.webp' });

      const result = await service.confirmUpload('s1', 'FRONT' as any, 'scans/s1/FRONT-123.jpg', 'p1');

      expect(prisma.scanImage.create).toHaveBeenCalledWith({
        data: {
          sessionId: 's1',
          imageType: 'FRONT',
          s3Key: 'scans/s1/FRONT-123.jpg',
        },
      });
      expect(thumbnail.generateAndStoreCloud).toHaveBeenCalledWith('scans/s1/FRONT-123.jpg');
      expect(prisma.scanImage.update).toHaveBeenCalledWith({
        where: { id: 'img1' },
        data: { thumbnailKey: 'scans/s1/FRONT-123-thumb.webp' },
      });
      expect(result.thumbnailKey).toBe('scans/s1/FRONT-123-thumb.webp');
    });

    it('should not break upload if thumbnail generation fails', async () => {
      prisma.scanSession.findFirst.mockResolvedValueOnce({
        id: 's1',
        patient: { practiceId: 'p1' },
      });
      const mockImage = { id: 'img1', sessionId: 's1', s3Key: 'scans/s1/FRONT-123.jpg' };
      prisma.scanImage.create.mockResolvedValueOnce(mockImage);
      prisma.scanSession.update.mockResolvedValueOnce({});
      thumbnail.generateAndStoreCloud.mockRejectedValueOnce(new Error('sharp crashed'));

      const result = await service.confirmUpload('s1', 'FRONT' as any, 'scans/s1/FRONT-123.jpg', 'p1');

      expect(result).toEqual(mockImage);
    });

    it('should throw NotFoundException when session not found', async () => {
      prisma.scanSession.findFirst.mockResolvedValueOnce(null);

      await expect(service.confirmUpload('missing', 'FRONT' as any, 'key', 'p1'))
        .rejects.toThrow(NotFoundException);
    });
  });

  describe('handleLocalUpload', () => {
    const mockFile = {
      originalname: 'photo.jpg',
      buffer: Buffer.from('image-data'),
      mimetype: 'image/jpeg',
    } as Express.Multer.File;

    it('should upload to cloud when enabled and generate thumbnail', async () => {
      prisma.scanSession.findFirst.mockResolvedValueOnce({
        id: 's1',
        patient: { practiceId: 'p1' },
      });
      storage.isCloudEnabled.mockReturnValue(true);
      const mockImage = { id: 'img1', sessionId: 's1', s3Key: 'scans/s1/FRONT-123.jpg' };
      prisma.scanImage.create.mockResolvedValueOnce(mockImage);
      prisma.scanSession.update.mockResolvedValueOnce({});
      prisma.scanImage.update.mockResolvedValueOnce({ ...mockImage, thumbnailKey: 'scans/s1/FRONT-123-thumb.webp' });

      const result = await service.handleLocalUpload('s1', 'FRONT' as any, mockFile, 'p1');

      expect(storage.putObject).toHaveBeenCalled();
      expect(thumbnail.generateAndStoreFromBuffer).toHaveBeenCalledWith(mockFile.buffer, 'scans/s1/FRONT-123.jpg', null);
      expect(result.thumbnailKey).toBe('scans/s1/FRONT-123-thumb.webp');
    });

    it('should save to local filesystem when cloud is disabled and generate thumbnail', async () => {
      prisma.scanSession.findFirst.mockResolvedValueOnce({
        id: 's1',
        patient: { practiceId: 'p1' },
      });
      storage.isCloudEnabled.mockReturnValue(false);
      const mockImage = { id: 'img1', sessionId: 's1', localPath: '/uploads/test.jpg' };
      prisma.scanImage.create.mockResolvedValueOnce(mockImage);
      prisma.scanSession.update.mockResolvedValueOnce({});
      prisma.scanImage.update.mockResolvedValueOnce({ ...mockImage, thumbnailKey: 'scans/s1/FRONT-123-thumb.webp' });

      const result = await service.handleLocalUpload('s1', 'FRONT' as any, mockFile, 'p1');

      expect(storage.putObject).not.toHaveBeenCalled();
      expect(thumbnail.generateAndStoreFromBuffer).toHaveBeenCalled();
      expect(result.thumbnailKey).toBe('scans/s1/FRONT-123-thumb.webp');
    });

    it('should not break upload if thumbnail generation fails', async () => {
      prisma.scanSession.findFirst.mockResolvedValueOnce({
        id: 's1',
        patient: { practiceId: 'p1' },
      });
      storage.isCloudEnabled.mockReturnValue(true);
      const mockImage = { id: 'img1', sessionId: 's1', s3Key: 'scans/s1/FRONT-123.jpg' };
      prisma.scanImage.create.mockResolvedValueOnce(mockImage);
      prisma.scanSession.update.mockResolvedValueOnce({});
      thumbnail.generateAndStoreFromBuffer.mockRejectedValueOnce(new Error('sharp crashed'));

      const result = await service.handleLocalUpload('s1', 'FRONT' as any, mockFile, 'p1');

      expect(result).toEqual(mockImage);
    });

    it('should throw NotFoundException when session not found', async () => {
      prisma.scanSession.findFirst.mockResolvedValueOnce(null);

      await expect(service.handleLocalUpload('missing', 'FRONT' as any, mockFile, 'p1'))
        .rejects.toThrow(NotFoundException);
    });
  });

  describe('getImageUrl', () => {
    it('should return pre-signed URL for cloud-stored image', async () => {
      prisma.scanImage.findFirst.mockResolvedValueOnce({
        id: 'img1',
        s3Key: 'scans/s1/FRONT-123.jpg',
        localPath: null,
      });
      storage.isCloudEnabled.mockReturnValue(true);

      const result = await service.getImageUrl('img1', 'p1');

      expect(result.url).toBe('https://download-url.example.com');
      expect(storage.generateDownloadUrl).toHaveBeenCalledWith('scans/s1/FRONT-123.jpg');
    });

    it('should return local path for locally-stored image', async () => {
      prisma.scanImage.findFirst.mockResolvedValueOnce({
        id: 'img1',
        s3Key: null,
        localPath: '/uploads/test.jpg',
      });

      const result = await service.getImageUrl('img1', 'p1');

      expect(result.url).toBe('/uploads/test.jpg');
    });

    it('should throw NotFoundException when image not found', async () => {
      prisma.scanImage.findFirst.mockResolvedValueOnce(null);

      await expect(service.getImageUrl('missing', 'p1'))
        .rejects.toThrow(NotFoundException);
    });
  });

  describe('getThumbnailUrl', () => {
    it('should return pre-signed URL for cloud-stored thumbnail', async () => {
      prisma.scanImage.findFirst.mockResolvedValueOnce({
        id: 'img1',
        s3Key: 'scans/s1/FRONT-123.jpg',
        thumbnailKey: 'scans/s1/FRONT-123-thumb.webp',
        localPath: null,
      });
      storage.isCloudEnabled.mockReturnValue(true);

      const result = await service.getThumbnailUrl('img1', 'p1');

      expect(result.url).toBe('https://download-url.example.com');
      expect(storage.generateDownloadUrl).toHaveBeenCalledWith('scans/s1/FRONT-123-thumb.webp');
    });

    it('should return local thumbnail path', async () => {
      prisma.scanImage.findFirst.mockResolvedValueOnce({
        id: 'img1',
        s3Key: null,
        thumbnailKey: '/uploads/s1-FRONT-123-thumb.webp',
        localPath: '/uploads/s1-FRONT-123.jpg',
      });

      const result = await service.getThumbnailUrl('img1', 'p1');

      expect(result.url).toBe('/uploads/s1-FRONT-123-thumb.webp');
    });

    it('should return null url when no thumbnailKey', async () => {
      prisma.scanImage.findFirst.mockResolvedValueOnce({
        id: 'img1',
        s3Key: 'scans/s1/FRONT-123.jpg',
        thumbnailKey: null,
        localPath: null,
      });

      const result = await service.getThumbnailUrl('img1', 'p1');

      expect(result.url).toBeNull();
    });

    it('should throw NotFoundException when image not found', async () => {
      prisma.scanImage.findFirst.mockResolvedValueOnce(null);

      await expect(service.getThumbnailUrl('missing', 'p1'))
        .rejects.toThrow(NotFoundException);
    });
  });
});
