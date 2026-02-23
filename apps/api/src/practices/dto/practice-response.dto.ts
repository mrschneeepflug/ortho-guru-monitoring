import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class PracticeResponseDto {
  @ApiProperty({ description: 'Practice ID (cuid)' })
  id: string;

  @ApiProperty({ description: 'Practice name' })
  name: string;

  @ApiPropertyOptional({ description: 'Practice address' })
  address: string | null;

  @ApiPropertyOptional({ description: 'Practice phone number' })
  phone: string | null;

  @ApiProperty({ description: 'Subscription tier', default: 'basic' })
  subscriptionTier: string;

  @ApiProperty({ description: 'Tagging rate' })
  taggingRate: number;

  @ApiProperty({ description: 'Discount percent' })
  discountPercent: number;

  @ApiProperty({ description: 'Practice settings (JSON)' })
  settings: any;

  @ApiProperty({ description: 'Creation timestamp' })
  createdAt: Date;

  @ApiProperty({ description: 'Last update timestamp' })
  updatedAt: Date;
}
