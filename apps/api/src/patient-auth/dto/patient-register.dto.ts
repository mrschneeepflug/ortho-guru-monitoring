import { IsString, IsEmail, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class PatientRegisterDto {
  @ApiProperty({ description: 'Invite token from the URL' })
  @IsString()
  token: string;

  @ApiProperty({ description: 'Patient email address' })
  @IsEmail()
  email: string;

  @ApiProperty({ description: 'Password (min 8 characters)', minLength: 8 })
  @IsString()
  @MinLength(8)
  password: string;
}
