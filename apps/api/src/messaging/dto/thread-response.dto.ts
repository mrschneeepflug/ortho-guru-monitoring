import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { MessageResponseDto } from './message-response.dto';

export class ThreadResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  patientId: string;

  @ApiProperty()
  subject: string;

  @ApiProperty()
  isActive: boolean;

  @ApiPropertyOptional({ type: () => MessageResponseDto, nullable: true })
  lastMessage: MessageResponseDto | null;

  @ApiProperty({ description: 'Number of unread messages in this thread' })
  unreadCount: number;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}
