import { Module } from '@nestjs/common';
import { ScansService } from './scans.service';
import { UploadService } from './upload.service';
import { ThumbnailService } from './thumbnail.service';
import { ScansController } from './scans.controller';
import { UploadController } from './upload.controller';

@Module({
  controllers: [ScansController, UploadController],
  providers: [ScansService, UploadService, ThumbnailService],
  exports: [ScansService],
})
export class ScansModule {}
