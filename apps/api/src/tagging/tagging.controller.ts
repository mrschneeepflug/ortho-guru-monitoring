import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { TaggingService } from './tagging.service';
import { TaggingAnalyticsService } from './tagging-analytics.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { JwtPayload } from '../common/interfaces/jwt-payload.interface';
import { CreateTagSetDto } from './dto/create-tag-set.dto';
import { TagAnalyticsResponseDto } from './dto/tag-analytics-response.dto';

@ApiTags('tagging')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('tagging')
export class TaggingController {
  constructor(
    private readonly taggingService: TaggingService,
    private readonly taggingAnalyticsService: TaggingAnalyticsService,
  ) {}

  @Post('sessions/:sessionId/tags')
  createTagSet(
    @Param('sessionId') sessionId: string,
    @Body() dto: CreateTagSetDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.taggingService.createTagSet(
      sessionId,
      dto,
      user.sub,
      user.practiceId,
    );
  }

  @Get('sessions/:sessionId/tags')
  findBySession(@Param('sessionId') sessionId: string) {
    return this.taggingService.findBySession(sessionId);
  }

  @Get('analytics')
  getAnalytics(
    @CurrentUser('practiceId') practiceId: string,
  ): Promise<TagAnalyticsResponseDto> {
    return this.taggingAnalyticsService.getAnalytics(practiceId);
  }
}
