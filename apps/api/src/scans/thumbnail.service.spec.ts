import { ThumbnailService } from './thumbnail.service';
import { StorageService } from '../common/storage/storage.service';
import sharp from 'sharp';
import * as fs from 'fs';

jest.mock('fs');

function createMockStorageService() {
  return {
    isCloudEnabled: jest.fn().mockReturnValue(true),
    getObject: jest.fn(),
    putObject: jest.fn().mockResolvedValue(undefined),
    generateDownloadUrl: jest.fn(),
  } as unknown as StorageService;
}

describe('ThumbnailService', () => {
  let service: ThumbnailService;
  let storage: jest.Mocked<StorageService>;

  beforeEach(() => {
    storage = createMockStorageService() as jest.Mocked<StorageService>;
    service = new ThumbnailService(storage);
  });

  describe('generateThumbnail', () => {
    it('should return a WebP buffer smaller than the original', async () => {
      // Generate a real test image using sharp
      const testImage = await sharp({
        create: { width: 800, height: 600, channels: 3, background: { r: 255, g: 0, b: 0 } },
      })
        .jpeg()
        .toBuffer();

      const thumb = await service.generateThumbnail(testImage);

      expect(Buffer.isBuffer(thumb)).toBe(true);
      expect(thumb.length).toBeGreaterThan(0);
      expect(thumb.length).toBeLessThan(testImage.length);

      // Verify output is WebP and fits within 300px
      const metadata = await sharp(thumb).metadata();
      expect(metadata.format).toBe('webp');
      expect(metadata.width).toBeLessThanOrEqual(300);
      expect(metadata.height).toBeLessThanOrEqual(300);
    });
  });

  describe('buildThumbnailKey', () => {
    it('should append -thumb.webp to the key', () => {
      expect(service.buildThumbnailKey('scans/s1/FRONT-123.jpg'))
        .toBe('scans/s1/FRONT-123-thumb.webp');
    });

    it('should handle keys with no extension', () => {
      expect(service.buildThumbnailKey('scans/s1/FRONT-123'))
        .toBe('scans/s1/FRONT-123-thumb.webp');
    });

    it('should handle keys with png extension', () => {
      expect(service.buildThumbnailKey('scans/s1/FRONT-123.png'))
        .toBe('scans/s1/FRONT-123-thumb.webp');
    });
  });

  describe('generateAndStoreCloud', () => {
    it('should download, resize, upload and return thumbnailKey', async () => {
      const testImage = await sharp({
        create: { width: 400, height: 300, channels: 3, background: { r: 0, g: 255, b: 0 } },
      })
        .jpeg()
        .toBuffer();

      storage.getObject.mockResolvedValue(testImage);
      storage.putObject.mockResolvedValue(undefined);

      const result = await service.generateAndStoreCloud('scans/s1/FRONT-123.jpg');

      expect(result).toBe('scans/s1/FRONT-123-thumb.webp');
      expect(storage.getObject).toHaveBeenCalledWith('scans/s1/FRONT-123.jpg');
      expect(storage.putObject).toHaveBeenCalledWith(
        'scans/s1/FRONT-123-thumb.webp',
        expect.any(Buffer),
        'image/webp',
      );
    });

    it('should return null if getObject fails', async () => {
      storage.getObject.mockRejectedValue(new Error('Not found'));

      const result = await service.generateAndStoreCloud('scans/s1/FRONT-123.jpg');

      expect(result).toBeNull();
    });

    it('should return null if putObject fails', async () => {
      const testImage = await sharp({
        create: { width: 100, height: 100, channels: 3, background: { r: 0, g: 0, b: 255 } },
      })
        .jpeg()
        .toBuffer();

      storage.getObject.mockResolvedValue(testImage);
      storage.putObject.mockRejectedValue(new Error('Upload failed'));

      const result = await service.generateAndStoreCloud('scans/s1/FRONT-123.jpg');

      expect(result).toBeNull();
    });
  });

  describe('generateAndStoreFromBuffer', () => {
    let testImage: Buffer;

    beforeAll(async () => {
      testImage = await sharp({
        create: { width: 400, height: 300, channels: 3, background: { r: 100, g: 100, b: 100 } },
      })
        .jpeg()
        .toBuffer();
    });

    it('should upload to cloud when s3Key is provided', async () => {
      storage.isCloudEnabled.mockReturnValue(true);
      storage.putObject.mockResolvedValue(undefined);

      const result = await service.generateAndStoreFromBuffer(testImage, 'scans/s1/FRONT-123.jpg', null);

      expect(result.thumbnailKey).toBe('scans/s1/FRONT-123-thumb.webp');
      expect(storage.putObject).toHaveBeenCalledWith(
        'scans/s1/FRONT-123-thumb.webp',
        expect.any(Buffer),
        'image/webp',
      );
    });

    it('should save locally when localPath is provided', async () => {
      const mockWriteFileSync = fs.writeFileSync as jest.Mock;

      const result = await service.generateAndStoreFromBuffer(testImage, null, '/uploads/s1-FRONT-123.jpg');

      expect(result.thumbnailKey).toContain('s1-FRONT-123-thumb.webp');
      expect(mockWriteFileSync).toHaveBeenCalledWith(
        expect.stringContaining('-thumb.webp'),
        expect.any(Buffer),
      );
    });

    it('should return null thumbnailKey if neither s3Key nor localPath given', async () => {
      const result = await service.generateAndStoreFromBuffer(testImage, null, null);
      expect(result.thumbnailKey).toBeNull();
    });

    it('should return null thumbnailKey on sharp error', async () => {
      const badBuffer = Buffer.from('not-an-image');
      const result = await service.generateAndStoreFromBuffer(badBuffer, 'scans/s1/FRONT.jpg', null);
      expect(result.thumbnailKey).toBeNull();
    });
  });
});
