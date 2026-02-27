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
import { PatientStatus } from '@prisma/client';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { JwtPayload } from '../common/interfaces/jwt-payload.interface';
import { PatientsService } from './patients.service';
import { PatientAuthService } from '../patient-auth/patient-auth.service';
import { CreatePatientDto } from './dto/create-patient.dto';
import { UpdatePatientDto } from './dto/update-patient.dto';
import { PatientQueryDto } from './dto/patient-query.dto';
import { PatientResponseDto } from './dto/patient-response.dto';
import { InvitePatientDto } from './dto/invite-patient.dto';

@ApiTags('patients')
@ApiBearerAuth()
@Controller('patients')
export class PatientsController {
  constructor(
    private readonly patientsService: PatientsService,
    private readonly patientAuthService: PatientAuthService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'List patients for the current practice' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'status', required: false, enum: PatientStatus })
  @ApiQuery({ name: 'doctorId', required: false, type: String })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiOkResponse({ description: 'Paginated patient list' })
  findAll(
    @CurrentUser() user: JwtPayload,
    @Query() query: PatientQueryDto,
  ) {
    return this.patientsService.findAll(user.practiceId, query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a single patient by ID' })
  @ApiOkResponse({ type: PatientResponseDto })
  findOne(
    @Param('id') id: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.patientsService.findOne(id, user.practiceId);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new patient' })
  @ApiCreatedResponse({ type: PatientResponseDto })
  create(
    @Body() dto: CreatePatientDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.patientsService.create(dto, user.practiceId);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update an existing patient' })
  @ApiOkResponse({ type: PatientResponseDto })
  update(
    @Param('id') id: string,
    @Body() dto: UpdatePatientDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.patientsService.update(id, dto, user.practiceId);
  }

  @Post(':id/invite')
  @ApiOperation({ summary: 'Generate a patient portal invite' })
  @ApiCreatedResponse({ description: 'Invite token and URL' })
  async invite(
    @Param('id') id: string,
    @Body() dto: InvitePatientDto,
    @CurrentUser() user: JwtPayload,
  ) {
    const result = await this.patientAuthService.createInvite(id, dto.email, user.practiceId);
    const patientPortalUrl = process.env.PATIENT_PORTAL_URL || 'http://localhost:3002';
    return {
      token: result.token,
      inviteUrl: `${patientPortalUrl}/register/${result.token}`,
      expiresAt: result.expiresAt,
    };
  }
}
