import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsInt,
  IsString,
  IsOptional,
  IsEnum,
  Min,
  Max,
  MaxLength,
} from 'class-validator';
import { Type } from 'class-transformer';
import { AttachmentCheck } from '@prisma/client';

export class CreatePatientScanSessionDto {
  @ApiProperty({ description: 'Current tray number', minimum: 1 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  trayNumber: number;

  @ApiProperty({ description: 'Aligner fit self-assessment (1=Good, 2=Fair, 3=Poor)', minimum: 1, maximum: 3 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(3)
  alignerFit: number;

  @ApiPropertyOptional({ description: 'Daily wear time in hours (0-24), only when fit is Fair/Poor', minimum: 0, maximum: 24 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(24)
  wearTimeHrs?: number;

  @ApiProperty({ description: 'Are all attachments still in place?', enum: AttachmentCheck })
  @IsEnum(AttachmentCheck)
  attachmentCheck: AttachmentCheck;

  @ApiPropertyOptional({ description: 'Optional notes for the doctor', maxLength: 1000 })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  notes?: string;
}
