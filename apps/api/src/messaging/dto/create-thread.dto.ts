import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty } from 'class-validator';

export class CreateThreadDto {
  @ApiProperty({ description: 'ID of the patient this thread is for' })
  @IsString()
  @IsNotEmpty()
  patientId: string;

  @ApiProperty({ description: 'Subject line of the message thread' })
  @IsString()
  @IsNotEmpty()
  subject: string;
}
