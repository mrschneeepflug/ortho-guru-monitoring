import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PatientStatus } from '@prisma/client';

export class PatientResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  practiceId: string;

  @ApiProperty()
  doctorId: string;

  @ApiProperty()
  name: string;

  @ApiPropertyOptional({ nullable: true })
  dateOfBirth: Date | null;

  @ApiPropertyOptional({ nullable: true })
  treatmentType: string | null;

  @ApiPropertyOptional({ nullable: true })
  alignerBrand: string | null;

  @ApiProperty()
  currentStage: number;

  @ApiPropertyOptional({ nullable: true })
  totalStages: number | null;

  @ApiProperty({ default: 14 })
  scanFrequency: number;

  @ApiProperty({ enum: PatientStatus })
  status: PatientStatus;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}
