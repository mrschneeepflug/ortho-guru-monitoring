import { PartialType } from '@nestjs/swagger';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsEnum } from 'class-validator';
import { PatientStatus } from '@prisma/client';
import { CreatePatientDto } from './create-patient.dto';

export class UpdatePatientDto extends PartialType(CreatePatientDto) {
  @ApiPropertyOptional({
    description: 'Patient status',
    enum: PatientStatus,
  })
  @IsOptional()
  @IsEnum(PatientStatus)
  status?: PatientStatus;
}
