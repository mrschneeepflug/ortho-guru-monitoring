import { Controller, Post, Get, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { PatientAuthService } from './patient-auth.service';
import { PatientRegisterDto } from './dto/patient-register.dto';
import { PatientLoginDto } from './dto/patient-login.dto';
import { PatientAuthGuard } from '../common/guards/patient-auth.guard';
import { CurrentPatient } from '../common/decorators/current-patient.decorator';
import { PatientJwtPayload } from '../common/interfaces/jwt-payload.interface';

@ApiTags('patient-auth')
@Controller('patient-auth')
export class PatientAuthController {
  constructor(private readonly patientAuthService: PatientAuthService) {}

  @Post('register')
  @ApiOperation({ summary: 'Register using an invite token' })
  register(@Body() dto: PatientRegisterDto) {
    return this.patientAuthService.register(dto.token, dto.email, dto.password);
  }

  @Post('login')
  @ApiOperation({ summary: 'Patient login with email and password' })
  login(@Body() dto: PatientLoginDto) {
    return this.patientAuthService.login(dto.email, dto.password);
  }

  @Get('me')
  @UseGuards(PatientAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current patient profile' })
  me(@CurrentPatient() patient: PatientJwtPayload) {
    return this.patientAuthService.getProfile(patient.sub);
  }

  @Get('validate-invite/:token')
  @ApiOperation({ summary: 'Check if an invite token is valid' })
  validateInvite(@Param('token') token: string) {
    return this.patientAuthService.validateInvite(token);
  }
}
