import { ArgumentsHost, HttpStatus } from '@nestjs/common';
import { PrismaExceptionFilter } from './prisma-exception.filter';

describe('PrismaExceptionFilter', () => {
  let filter: PrismaExceptionFilter;
  let mockJson: jest.Mock;
  let mockStatus: jest.Mock;
  let mockHost: ArgumentsHost;

  beforeEach(() => {
    filter = new PrismaExceptionFilter();
    mockJson = jest.fn();
    mockStatus = jest.fn().mockReturnValue({ json: mockJson });
    mockHost = {
      switchToHttp: jest.fn().mockReturnValue({
        getResponse: jest.fn().mockReturnValue({ status: mockStatus }),
      }),
    } as unknown as ArgumentsHost;
  });

  function createPrismaError(code: string) {
    return { code, message: 'Prisma error', clientVersion: '5.8.0' } as any;
  }

  it('should return 409 for P2002 (unique constraint)', () => {
    filter.catch(createPrismaError('P2002'), mockHost);

    expect(mockStatus).toHaveBeenCalledWith(HttpStatus.CONFLICT);
    expect(mockJson).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: 409,
        message: 'A record with this value already exists',
      }),
    );
  });

  it('should return 404 for P2025 (not found)', () => {
    filter.catch(createPrismaError('P2025'), mockHost);

    expect(mockStatus).toHaveBeenCalledWith(HttpStatus.NOT_FOUND);
    expect(mockJson).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: 404,
        message: 'Record not found',
      }),
    );
  });

  it('should return 400 for P2003 (foreign key)', () => {
    filter.catch(createPrismaError('P2003'), mockHost);

    expect(mockStatus).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST);
    expect(mockJson).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: 400,
        message: 'Foreign key constraint failed',
      }),
    );
  });

  it('should return 500 for unknown Prisma errors', () => {
    filter.catch(createPrismaError('P9999'), mockHost);

    expect(mockStatus).toHaveBeenCalledWith(HttpStatus.INTERNAL_SERVER_ERROR);
    expect(mockJson).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: 500,
        message: 'Database error',
      }),
    );
  });

  it('should include timestamp in response', () => {
    filter.catch(createPrismaError('P2002'), mockHost);

    expect(mockJson).toHaveBeenCalledWith(
      expect.objectContaining({
        timestamp: expect.any(String),
      }),
    );
  });
});
