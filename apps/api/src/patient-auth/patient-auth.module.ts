import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PatientAuthService } from './patient-auth.service';
import { PatientAuthController } from './patient-auth.controller';

@Module({
  imports: [
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'dev-secret',
      signOptions: { expiresIn: '1h' },
    }),
  ],
  controllers: [PatientAuthController],
  providers: [PatientAuthService],
  exports: [PatientAuthService],
})
export class PatientAuthModule {}
