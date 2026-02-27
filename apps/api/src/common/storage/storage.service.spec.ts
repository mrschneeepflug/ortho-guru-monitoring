import { StorageService } from './storage.service';

// Mock the AWS SDK modules
jest.mock('@aws-sdk/client-s3', () => {
  const mockSend = jest.fn().mockResolvedValue({});
  return {
    S3Client: jest.fn().mockImplementation(() => ({ send: mockSend })),
    PutObjectCommand: jest.fn().mockImplementation((input) => ({ input })),
    GetObjectCommand: jest.fn().mockImplementation((input) => ({ input })),
    DeleteObjectCommand: jest.fn().mockImplementation((input) => ({ input })),
    __mockSend: mockSend,
  };
});

jest.mock('@aws-sdk/s3-request-presigner', () => ({
  getSignedUrl: jest.fn().mockResolvedValue('https://presigned-url.example.com'),
}));

const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
const { S3Client, __mockSend: mockSend } = require('@aws-sdk/client-s3');

describe('StorageService', () => {
  const OLD_ENV = process.env;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env = { ...OLD_ENV };
  });

  afterAll(() => {
    process.env = OLD_ENV;
  });

  describe('when OCI env vars are set', () => {
    let service: StorageService;

    beforeEach(() => {
      process.env.OCI_S3_ENDPOINT = 'https://test.compat.objectstorage.eu-frankfurt-1.oraclecloud.com';
      process.env.OCI_S3_REGION = 'eu-frankfurt-1';
      process.env.OCI_S3_BUCKET = 'test-bucket';
      process.env.OCI_S3_ACCESS_KEY = 'test-key';
      process.env.OCI_S3_SECRET_KEY = 'test-secret';
      service = new StorageService();
    });

    it('should report cloud as enabled', () => {
      expect(service.isCloudEnabled()).toBe(true);
    });

    it('should configure S3Client with OCI endpoint', () => {
      expect(S3Client).toHaveBeenCalledWith(
        expect.objectContaining({
          endpoint: 'https://test.compat.objectstorage.eu-frankfurt-1.oraclecloud.com',
          region: 'eu-frankfurt-1',
          forcePathStyle: true,
        }),
      );
    });

    it('should generate an upload URL', async () => {
      const url = await service.generateUploadUrl('scans/s1/FRONT-123.jpg', 'image/jpeg');
      expect(url).toBe('https://presigned-url.example.com');
      expect(getSignedUrl).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          input: expect.objectContaining({
            Bucket: 'test-bucket',
            Key: 'scans/s1/FRONT-123.jpg',
            ContentType: 'image/jpeg',
          }),
        }),
        { expiresIn: 900 },
      );
    });

    it('should generate a download URL', async () => {
      const url = await service.generateDownloadUrl('scans/s1/FRONT-123.jpg');
      expect(url).toBe('https://presigned-url.example.com');
      expect(getSignedUrl).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          input: expect.objectContaining({
            Bucket: 'test-bucket',
            Key: 'scans/s1/FRONT-123.jpg',
          }),
        }),
        { expiresIn: 3600 },
      );
    });

    it('should put an object', async () => {
      const buffer = Buffer.from('image-data');
      await service.putObject('scans/s1/FRONT.jpg', buffer, 'image/jpeg');
      expect(mockSend).toHaveBeenCalled();
    });

    it('should delete an object', async () => {
      await service.deleteObject('scans/s1/FRONT.jpg');
      expect(mockSend).toHaveBeenCalled();
    });

    it('should get an object and return a Buffer', async () => {
      const chunks = [Buffer.from('chunk1'), Buffer.from('chunk2')];
      const mockBody = {
        [Symbol.asyncIterator]: async function* () {
          for (const chunk of chunks) yield chunk;
        },
      };
      mockSend.mockResolvedValueOnce({ Body: mockBody });

      const result = await service.getObject('scans/s1/FRONT.jpg');

      expect(Buffer.isBuffer(result)).toBe(true);
      expect(result.toString()).toBe('chunk1chunk2');
      expect(mockSend).toHaveBeenCalled();
    });
  });

  describe('when OCI env vars are NOT set', () => {
    let service: StorageService;

    beforeEach(() => {
      delete process.env.OCI_S3_ENDPOINT;
      delete process.env.OCI_S3_ACCESS_KEY;
      delete process.env.OCI_S3_SECRET_KEY;
      service = new StorageService();
    });

    it('should report cloud as disabled', () => {
      expect(service.isCloudEnabled()).toBe(false);
    });

    it('should throw on generateUploadUrl', async () => {
      await expect(service.generateUploadUrl('key', 'image/jpeg'))
        .rejects.toThrow('Cloud storage is not configured');
    });

    it('should throw on generateDownloadUrl', async () => {
      await expect(service.generateDownloadUrl('key'))
        .rejects.toThrow('Cloud storage is not configured');
    });

    it('should throw on putObject', async () => {
      await expect(service.putObject('key', Buffer.from(''), 'image/jpeg'))
        .rejects.toThrow('Cloud storage is not configured');
    });

    it('should throw on deleteObject', async () => {
      await expect(service.deleteObject('key'))
        .rejects.toThrow('Cloud storage is not configured');
    });

    it('should throw on getObject', async () => {
      await expect(service.getObject('key'))
        .rejects.toThrow('Cloud storage is not configured');
    });
  });

  describe('buildKey', () => {
    it('should generate a key with session ID and image type', () => {
      const service = new StorageService();
      const key = service.buildKey('session-123', 'FRONT', 'jpg');
      expect(key).toMatch(/^scans\/session-123\/FRONT-\d+\.jpg$/);
    });
  });
});
