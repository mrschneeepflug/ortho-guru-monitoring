import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, IsEnum } from 'class-validator';
import { SenderType } from '@prisma/client';

export class CreateMessageDto {
  @ApiProperty({ description: 'ID of the thread to post this message in' })
  @IsString()
  @IsNotEmpty()
  threadId: string;

  @ApiProperty({ description: 'Message body content' })
  @IsString()
  @IsNotEmpty()
  content: string;

  @ApiPropertyOptional({
    description: 'Who is sending the message',
    enum: SenderType,
    default: SenderType.DOCTOR,
  })
  @IsOptional()
  @IsEnum(SenderType)
  senderType?: SenderType = SenderType.DOCTOR;
}
