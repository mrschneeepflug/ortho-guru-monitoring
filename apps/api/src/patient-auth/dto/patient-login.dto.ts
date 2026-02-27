import { IsString, IsEmail } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class PatientLoginDto {
  @ApiProperty({ description: 'Patient email address' })
  @IsEmail()
  email: string;

  @ApiProperty({ description: 'Patient password' })
  @IsString()
  password: string;
}
