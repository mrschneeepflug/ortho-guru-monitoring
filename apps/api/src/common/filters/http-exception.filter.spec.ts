import { ArgumentsHost, HttpException, HttpStatus } from '@nestjs/common';
import { HttpExceptionFilter } from './http-exception.filter';

describe('HttpExceptionFilter', () => {
  let filter: HttpExceptionFilter;
  let mockJson: jest.Mock;
  let mockStatus: jest.Mock;
  let mockHost: ArgumentsHost;

  beforeEach(() => {
    filter = new HttpExceptionFilter();
    mockJson = jest.fn();
    mockStatus = jest.fn().mockReturnValue({ json: mockJson });
    mockHost = {
      switchToHttp: jest.fn().mockReturnValue({
        getResponse: jest.fn().mockReturnValue({ status: mockStatus }),
      }),
    } as unknown as ArgumentsHost;
  });

  it('should handle string exception response', () => {
    const exception = new HttpException('Not found', HttpStatus.NOT_FOUND);

    filter.catch(exception, mockHost);

    expect(mockStatus).toHaveBeenCalledWith(404);
    expect(mockJson).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: 404,
        message: 'Not found',
        timestamp: expect.any(String),
      }),
    );
  });

  it('should handle object exception response', () => {
    const exception = new HttpException(
      { message: 'Validation failed', errors: ['name is required'] },
      HttpStatus.BAD_REQUEST,
    );

    filter.catch(exception, mockHost);

    expect(mockStatus).toHaveBeenCalledWith(400);
    expect(mockJson).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: 400,
        message: 'Validation failed',
        errors: ['name is required'],
        timestamp: expect.any(String),
      }),
    );
  });

  it('should include timestamp in all responses', () => {
    const exception = new HttpException('Error', HttpStatus.INTERNAL_SERVER_ERROR);

    filter.catch(exception, mockHost);

    const response = mockJson.mock.calls[0][0];
    expect(response.timestamp).toBeDefined();
    // Verify it's a valid ISO date
    expect(() => new Date(response.timestamp)).not.toThrow();
  });

  it('should handle 401 Unauthorized', () => {
    const exception = new HttpException('Unauthorized', HttpStatus.UNAUTHORIZED);

    filter.catch(exception, mockHost);

    expect(mockStatus).toHaveBeenCalledWith(401);
  });

  it('should handle 403 Forbidden', () => {
    const exception = new HttpException('Forbidden', HttpStatus.FORBIDDEN);

    filter.catch(exception, mockHost);

    expect(mockStatus).toHaveBeenCalledWith(403);
  });
});
