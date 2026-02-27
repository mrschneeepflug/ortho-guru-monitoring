import { IsEmail, IsOptional } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class InvitePatientDto {
  @ApiPropertyOptional({ description: 'Optional email to pre-fill for the patient' })
  @IsEmail()
  @IsOptional()
  email?: string;
}
