import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsDateString,
  IsInt,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreatePatientDto {
  @ApiProperty({ description: 'Patient full name' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ description: 'Assigned doctor ID' })
  @IsString()
  @IsNotEmpty()
  doctorId: string;

  @ApiPropertyOptional({ description: 'Date of birth (ISO 8601)' })
  @IsOptional()
  @IsDateString()
  dateOfBirth?: string;

  @ApiPropertyOptional({ description: 'Type of treatment (e.g. aligners, braces)' })
  @IsOptional()
  @IsString()
  treatmentType?: string;

  @ApiPropertyOptional({ description: 'Aligner brand name' })
  @IsOptional()
  @IsString()
  alignerBrand?: string;

  @ApiPropertyOptional({ description: 'Current aligner/treatment stage', default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  currentStage?: number;

  @ApiPropertyOptional({ description: 'Total number of treatment stages' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  totalStages?: number;

  @ApiPropertyOptional({
    description: 'Days between scan submissions',
    default: 14,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  scanFrequency?: number;
}
