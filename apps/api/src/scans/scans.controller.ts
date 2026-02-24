import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  Query,
} from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiQuery,
  ApiOperation,
  ApiOkResponse,
  ApiCreatedResponse,
} from '@nestjs/swagger';
import { ScanStatus } from '@prisma/client';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { JwtPayload } from '../common/interfaces/jwt-payload.interface';
import { ScansService } from './scans.service';
import { CreateSessionDto } from './dto/create-session.dto';
import { SessionQueryDto } from './dto/session-query.dto';
import { UpdateStatusDto } from './dto/update-status.dto';
import { SessionResponseDto } from './dto/session-response.dto';

@ApiTags('scans')
@ApiBearerAuth()
@Controller('scans/sessions')
export class ScansController {
  constructor(private readonly scansService: ScansService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new scan session for a patient' })
  @ApiCreatedResponse({ type: SessionResponseDto })
  create(
    @Body() dto: CreateSessionDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.scansService.createSession(dto.patientId, user.practiceId);
  }

  @Get()
  @ApiOperation({ summary: 'List scan sessions for the current practice' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'status', required: false, enum: ScanStatus })
  @ApiOkResponse({ description: 'Paginated scan session list' })
  findAll(
    @CurrentUser() user: JwtPayload,
    @Query() query: SessionQueryDto,
  ) {
    return this.scansService.findAll(user.practiceId, query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get scan session detail with images and tags' })
  @ApiOkResponse({ type: SessionResponseDto })
  findOne(
    @Param('id') id: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.scansService.findOne(id, user.practiceId);
  }

  @Patch(':id/status')
  @ApiOperation({ summary: 'Update the status of a scan session' })
  @ApiOkResponse({ type: SessionResponseDto })
  updateStatus(
    @Param('id') id: string,
    @Body() dto: UpdateStatusDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.scansService.updateStatus(
      id,
      dto.status,
      user.sub,
      user.practiceId,
    );
  }
}
