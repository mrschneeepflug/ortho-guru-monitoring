import { Global, Module } from '@nestjs/common';
import { RedisService } from './redis.service';
import { RefreshTokenService } from './refresh-token.service';

@Global()
@Module({
  providers: [RedisService, RefreshTokenService],
  exports: [RefreshTokenService],
})
export class RefreshTokenModule {}
