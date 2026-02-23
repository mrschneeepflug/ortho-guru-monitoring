import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty } from 'class-validator';

export class CreateSessionDto {
  @ApiProperty({ description: 'ID of the patient this scan session belongs to' })
  @IsString()
  @IsNotEmpty()
  patientId: string;
}
