import { Module } from '@nestjs/common';
import { TaggingService } from './tagging.service';
import { TaggingAnalyticsService } from './tagging-analytics.service';
import { TaggingController } from './tagging.controller';

@Module({
  controllers: [TaggingController],
  providers: [TaggingService, TaggingAnalyticsService],
  exports: [TaggingService, TaggingAnalyticsService],
})
export class TaggingModule {}
