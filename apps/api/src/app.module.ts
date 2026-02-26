import { Module } from '@nestjs/common';
import { CommonModule } from './common/common.module';
import { StorageModule } from './common/storage/storage.module';
import { AuthModule } from './auth/auth.module';
import { PracticesModule } from './practices/practices.module';
import { PatientsModule } from './patients/patients.module';
import { ScansModule } from './scans/scans.module';
import { TaggingModule } from './tagging/tagging.module';
import { MessagingModule } from './messaging/messaging.module';
import { DashboardModule } from './dashboard/dashboard.module';

@Module({
  imports: [
    CommonModule,
    StorageModule,
    AuthModule,
    PracticesModule,
    PatientsModule,
    ScansModule,
    TaggingModule,
    MessagingModule,
    DashboardModule,
  ],
})
export class AppModule {}
