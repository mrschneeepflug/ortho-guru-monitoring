import { IsEmail, IsString, MinLength, IsOptional, IsEnum } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { DoctorRole } from '@prisma/client';

export class RegisterDto {
  @ApiProperty({ example: 'Dr. Jane Smith' })
  @IsString()
  name: string;

  @ApiProperty({ example: 'jane.smith@example.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'securePass123', minLength: 6 })
  @IsString()
  @MinLength(6)
  password: string;

  @ApiProperty({ example: 'clxxxxxxxxxxxxxx' })
  @IsString()
  practiceId: string;

  @ApiPropertyOptional({ enum: DoctorRole, default: DoctorRole.DOCTOR })
  @IsOptional()
  @IsEnum(DoctorRole)
  role?: DoctorRole = DoctorRole.DOCTOR;
}
