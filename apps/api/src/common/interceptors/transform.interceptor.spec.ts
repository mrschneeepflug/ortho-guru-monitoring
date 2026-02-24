import { of } from 'rxjs';
import { CallHandler, ExecutionContext } from '@nestjs/common';
import { TransformInterceptor } from './transform.interceptor';

describe('TransformInterceptor', () => {
  let interceptor: TransformInterceptor<unknown>;
  const mockContext = {} as ExecutionContext;

  beforeEach(() => {
    interceptor = new TransformInterceptor();
  });

  function createHandler(data: unknown): CallHandler {
    return { handle: () => of(data) };
  }

  it('should wrap plain data in { data } envelope', (done) => {
    const handler = createHandler({ name: 'test' });

    interceptor.intercept(mockContext, handler).subscribe((result) => {
      expect(result).toEqual({ data: { name: 'test' } });
      done();
    });
  });

  it('should pass through data that is already wrapped', (done) => {
    const wrapped = { data: { name: 'test' }, meta: { total: 1 } };
    const handler = createHandler(wrapped);

    interceptor.intercept(mockContext, handler).subscribe((result) => {
      expect(result).toEqual(wrapped);
      done();
    });
  });

  it('should wrap arrays in { data } envelope', (done) => {
    const handler = createHandler([1, 2, 3]);

    interceptor.intercept(mockContext, handler).subscribe((result) => {
      expect(result).toEqual({ data: [1, 2, 3] });
      done();
    });
  });

  it('should wrap null values', (done) => {
    const handler = createHandler(null);

    interceptor.intercept(mockContext, handler).subscribe((result) => {
      expect(result).toEqual({ data: null });
      done();
    });
  });

  it('should wrap string values', (done) => {
    const handler = createHandler('hello');

    interceptor.intercept(mockContext, handler).subscribe((result) => {
      expect(result).toEqual({ data: 'hello' });
      done();
    });
  });
});
