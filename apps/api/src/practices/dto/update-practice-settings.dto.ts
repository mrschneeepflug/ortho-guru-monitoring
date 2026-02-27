import { IsIn, IsOptional, IsString, ValidateIf } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class UpdatePracticeSettingsDto {
  @ApiProperty({ enum: ['portal', 'whatsapp'] })
  @IsIn(['portal', 'whatsapp'])
  messagingMode: 'portal' | 'whatsapp';

  @ApiPropertyOptional({ description: 'WhatsApp number (digits only, e.g. "1234567890")' })
  @ValidateIf((o) => o.messagingMode === 'whatsapp')
  @IsString()
  whatsappNumber?: string;
}
