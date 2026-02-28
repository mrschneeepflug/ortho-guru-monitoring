import { Module } from '@nestjs/common';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { CommonModule } from './common/common.module';
import { StorageModule } from './common/storage/storage.module';
import { AiModule } from './common/ai/ai.module';
import { AuthModule } from './auth/auth.module';
import { PracticesModule } from './practices/practices.module';
import { PatientsModule } from './patients/patients.module';
import { ScansModule } from './scans/scans.module';
import { TaggingModule } from './tagging/tagging.module';
import { MessagingModule } from './messaging/messaging.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { PatientAuthModule } from './patient-auth/patient-auth.module';
import { PatientPortalModule } from './patient-portal/patient-portal.module';
import { NotificationsModule } from './notifications/notifications.module';
import { RefreshTokenModule } from './common/refresh-token/refresh-token.module';

@Module({
  imports: [
    EventEmitterModule.forRoot(),
    CommonModule,
    StorageModule,
    AiModule,
    AuthModule,
    PracticesModule,
    PatientsModule,
    ScansModule,
    TaggingModule,
    MessagingModule,
    DashboardModule,
    PatientAuthModule,
    PatientPortalModule,
    NotificationsModule,
    RefreshTokenModule,
  ],
})
export class AppModule {}
