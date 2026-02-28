import { Controller, Post, Get, Body, Param, Req, Res, UseGuards, HttpCode, HttpStatus, UnauthorizedException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { Request, Response } from 'express';
import { PatientAuthService } from './patient-auth.service';
import { PatientRegisterDto } from './dto/patient-register.dto';
import { PatientLoginDto } from './dto/patient-login.dto';
import { PatientAuthGuard } from '../common/guards/patient-auth.guard';
import { CurrentPatient } from '../common/decorators/current-patient.decorator';
import { PatientJwtPayload } from '../common/interfaces/jwt-payload.interface';
import { Public } from '../common/decorators/public.decorator';
import { REFRESH_TOKEN_CONFIG } from '../common/refresh-token/refresh-token.constants';
import { setRefreshCookie, clearRefreshCookie } from '../common/refresh-token/cookie.helper';

const PATIENT_CONFIG = REFRESH_TOKEN_CONFIG.patient;

@ApiTags('patient-auth')
@Controller('patient-auth')
export class PatientAuthController {
  constructor(private readonly patientAuthService: PatientAuthService) {}

  @Post('register')
  @Public()
  @ApiOperation({ summary: 'Register using an invite token' })
  async register(
    @Body() dto: PatientRegisterDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const meta = { userAgent: req.headers['user-agent'], ipAddress: req.ip };
    const result = await this.patientAuthService.register(dto.token, dto.email, dto.password, meta);

    setRefreshCookie(res, result.refreshToken, PATIENT_CONFIG);

    return { accessToken: result.accessToken, patient: result.patient };
  }

  @Post('login')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Patient login with email and password' })
  async login(
    @Body() dto: PatientLoginDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const meta = { userAgent: req.headers['user-agent'], ipAddress: req.ip };
    const result = await this.patientAuthService.login(dto.email, dto.password, meta);

    setRefreshCookie(res, result.refreshToken, PATIENT_CONFIG);

    return { accessToken: result.accessToken, patient: result.patient };
  }

  @Public()
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Refresh patient access token using refresh cookie' })
  async refresh(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const rawToken = req.cookies?.[PATIENT_CONFIG.cookieName];
    if (!rawToken) {
      throw new UnauthorizedException('No refresh token');
    }

    const meta = { userAgent: req.headers['user-agent'], ipAddress: req.ip };
    const result = await this.patientAuthService.refreshAccessToken(rawToken, meta);

    setRefreshCookie(res, result.refreshToken, PATIENT_CONFIG);

    return { accessToken: result.accessToken };
  }

  @Public()
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Patient logout and revoke refresh token family' })
  async logout(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const rawToken = req.cookies?.[PATIENT_CONFIG.cookieName];
    if (rawToken) {
      await this.patientAuthService.logout(rawToken);
    }

    clearRefreshCookie(res, PATIENT_CONFIG);

    return { message: 'Logged out' };
  }

  @Get('me')
  @UseGuards(PatientAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current patient profile' })
  me(@CurrentPatient() patient: PatientJwtPayload) {
    return this.patientAuthService.getProfile(patient.sub);
  }

  @Get('validate-invite/:token')
  @Public()
  @ApiOperation({ summary: 'Check if an invite token is valid' })
  validateInvite(@Param('token') token: string) {
    return this.patientAuthService.validateInvite(token);
  }
}
