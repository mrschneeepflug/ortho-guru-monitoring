import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { SenderType } from '@prisma/client';

export class MessageResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  threadId: string;

  @ApiProperty({ enum: SenderType })
  senderType: SenderType;

  @ApiProperty()
  senderId: string;

  @ApiProperty()
  content: string;

  @ApiProperty({ description: 'Array of attachment references', default: [] })
  attachments: any[];

  @ApiPropertyOptional({ nullable: true })
  readAt: Date | null;

  @ApiProperty()
  createdAt: Date;
}
