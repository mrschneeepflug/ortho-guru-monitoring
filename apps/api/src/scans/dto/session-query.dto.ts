import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsEnum, IsInt, IsString, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { ScanStatus } from '@prisma/client';

export class SessionQueryDto {
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
    description: 'Filter by scan session status',
    enum: ScanStatus,
  })
  @IsOptional()
  @IsEnum(ScanStatus)
  status?: ScanStatus;

  @ApiPropertyOptional({
    description: 'Filter by patient ID',
  })
  @IsOptional()
  @IsString()
  patientId?: string;
}
