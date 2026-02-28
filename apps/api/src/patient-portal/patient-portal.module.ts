import { Module } from '@nestjs/common';
import { PatientPortalService } from './patient-portal.service';
import { PatientPortalController } from './patient-portal.controller';
import { PatientScansController } from './patient-scans.controller';
import { PatientMessagesController } from './patient-messages.controller';
import { PatientPushController } from './patient-push.controller';

@Module({
  controllers: [
    PatientPortalController,
    PatientScansController,
    PatientMessagesController,
    PatientPushController,
  ],
  providers: [PatientPortalService],
})
export class PatientPortalModule {}
