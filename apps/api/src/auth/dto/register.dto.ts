import { IsEmail, IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

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
}
