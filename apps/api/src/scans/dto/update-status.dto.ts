import { ApiProperty } from '@nestjs/swagger';
import { IsEnum } from 'class-validator';
import { ScanStatus } from '@prisma/client';

export class UpdateStatusDto {
  @ApiProperty({
    description: 'New status for the scan session',
    enum: ScanStatus,
  })
  @IsEnum(ScanStatus)
  status: ScanStatus;
}
