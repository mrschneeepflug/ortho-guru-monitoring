import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { PatientAuthGuard } from '../common/guards/patient-auth.guard';
import { CurrentPatient } from '../common/decorators/current-patient.decorator';
import { PatientJwtPayload } from '../common/interfaces/jwt-payload.interface';
import { PatientPortalService } from './patient-portal.service';

@ApiTags('patient-portal')
@ApiBearerAuth()
@UseGuards(PatientAuthGuard)
@Controller('patient/messages')
export class PatientMessagesController {
  constructor(private readonly portalService: PatientPortalService) {}

  @Get()
  @ApiOperation({ summary: 'List message threads with unread counts' })
  listThreads(@CurrentPatient() patient: PatientJwtPayload) {
    return this.portalService.listThreads(patient.sub);
  }

  @Get(':threadId')
  @ApiOperation({ summary: 'Get thread with all messages' })
  getThread(
    @CurrentPatient() patient: PatientJwtPayload,
    @Param('threadId') threadId: string,
  ) {
    return this.portalService.getThread(patient.sub, threadId);
  }

  @Post()
  @ApiOperation({ summary: 'Send a message' })
  sendMessage(
    @CurrentPatient() patient: PatientJwtPayload,
    @Body() body: { threadId: string; content: string },
  ) {
    return this.portalService.sendMessage(patient.sub, body.threadId, body.content);
  }

  @Patch(':messageId/read')
  @ApiOperation({ summary: 'Mark message as read' })
  markRead(
    @CurrentPatient() patient: PatientJwtPayload,
    @Param('messageId') messageId: string,
  ) {
    return this.portalService.markMessageRead(patient.sub, messageId);
  }
}
