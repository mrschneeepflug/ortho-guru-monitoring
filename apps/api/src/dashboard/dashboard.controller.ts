import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiOkResponse } from '@nestjs/swagger';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { JwtPayload } from '../common/interfaces/jwt-payload.interface';
import { DashboardService } from './dashboard.service';

@ApiTags('dashboard')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('feed')
  @ApiOperation({ summary: 'Get recent activity feed for the practice' })
  @ApiOkResponse({ description: 'Combined feed of scans, messages, and tags sorted by date' })
  getFeed(@CurrentUser() user: JwtPayload) {
    return this.dashboardService.getFeed(user.practiceId);
  }

  @Get('compliance')
  @ApiOperation({ summary: 'Get patient compliance statistics' })
  @ApiOkResponse({ description: 'Active patients, on-time count, overdue list, and compliance %' })
  getCompliance(@CurrentUser() user: JwtPayload) {
    return this.dashboardService.getComplianceStats(user.practiceId);
  }

  @Get('tagging-rate')
  @ApiOperation({ summary: 'Get 30-day tagging rate' })
  @ApiOkResponse({ description: 'Tagged sessions vs total sessions over the last 30 days' })
  getTaggingRate(@CurrentUser() user: JwtPayload) {
    return this.dashboardService.getTaggingRate(user.practiceId);
  }

  @Get('summary')
  @ApiOperation({ summary: 'Get combined dashboard summary' })
  @ApiOkResponse({ description: 'Pending scans, total patients, compliance %, and tagging rate' })
  getSummary(@CurrentUser() user: JwtPayload) {
    return this.dashboardService.getSummary(user.practiceId);
  }
}
