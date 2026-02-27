import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { PatientAuthGuard } from '../common/guards/patient-auth.guard';
import { CurrentPatient } from '../common/decorators/current-patient.decorator';
import { PatientJwtPayload } from '../common/interfaces/jwt-payload.interface';
import { PatientPortalService } from './patient-portal.service';

@ApiTags('patient-portal')
@ApiBearerAuth()
@UseGuards(PatientAuthGuard)
@Controller('patient')
export class PatientPortalController {
  constructor(private readonly portalService: PatientPortalService) {}

  @Get('profile')
  @ApiOperation({ summary: 'Get patient profile with treatment progress' })
  getProfile(@CurrentPatient() patient: PatientJwtPayload) {
    return this.portalService.getProfile(patient.sub);
  }
}
