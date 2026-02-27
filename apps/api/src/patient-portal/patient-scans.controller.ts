import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiConsumes } from '@nestjs/swagger';
import { ImageType } from '@prisma/client';
import { PatientAuthGuard } from '../common/guards/patient-auth.guard';
import { CurrentPatient } from '../common/decorators/current-patient.decorator';
import { PatientJwtPayload } from '../common/interfaces/jwt-payload.interface';
import { PatientPortalService } from './patient-portal.service';

@ApiTags('patient-portal')
@ApiBearerAuth()
@UseGuards(PatientAuthGuard)
@Controller('patient/scans')
export class PatientScansController {
  constructor(private readonly portalService: PatientPortalService) {}

  @Get()
  @ApiOperation({ summary: 'List own scan sessions' })
  listScans(@CurrentPatient() patient: PatientJwtPayload) {
    return this.portalService.listScans(patient.sub);
  }

  @Post('sessions')
  @ApiOperation({ summary: 'Create a new scan session' })
  createSession(@CurrentPatient() patient: PatientJwtPayload) {
    return this.portalService.createScanSession(patient.sub);
  }

  @Post('upload-url')
  @ApiOperation({ summary: 'Get presigned upload URL' })
  getUploadUrl(
    @CurrentPatient() patient: PatientJwtPayload,
    @Body() body: { sessionId: string; imageType: ImageType },
  ) {
    return this.portalService.generateUploadUrl(patient.sub, body.sessionId, body.imageType);
  }

  @Post('upload/confirm')
  @ApiOperation({ summary: 'Confirm direct upload' })
  confirmUpload(
    @CurrentPatient() patient: PatientJwtPayload,
    @Body() body: { sessionId: string; imageType: ImageType; key: string },
  ) {
    return this.portalService.confirmUpload(patient.sub, body.sessionId, body.imageType, body.key);
  }

  @Post('upload')
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: 10 * 1024 * 1024 } }))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Multipart file upload fallback' })
  upload(
    @CurrentPatient() patient: PatientJwtPayload,
    @UploadedFile() file: Express.Multer.File,
    @Body() body: { sessionId: string; imageType: ImageType },
  ) {
    return this.portalService.handleLocalUpload(patient.sub, body.sessionId, body.imageType, file);
  }

  @Get('images/:id/url')
  @ApiOperation({ summary: 'Get presigned download URL for image' })
  getImageUrl(
    @CurrentPatient() patient: PatientJwtPayload,
    @Param('id') imageId: string,
  ) {
    return this.portalService.getImageUrl(patient.sub, imageId);
  }
}
