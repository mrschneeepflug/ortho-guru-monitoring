import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsEnum, IsInt, Min, IsString } from 'class-validator';
import { Type } from 'class-transformer';
import { PatientStatus } from '@prisma/client';

export class PatientQueryDto {
  @ApiPropertyOptional({ description: 'Page number', default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({
    description: 'Items per page',
    default: 20,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number = 20;

  @ApiPropertyOptional({
    description: 'Filter by patient status',
    enum: PatientStatus,
  })
  @IsOptional()
  @IsEnum(PatientStatus)
  status?: PatientStatus;

  @ApiPropertyOptional({ description: 'Filter by doctor ID' })
  @IsOptional()
  @IsString()
  doctorId?: string;

  @ApiPropertyOptional({ description: 'Search by patient name (case-insensitive)' })
  @IsOptional()
  @IsString()
  search?: string;
}
