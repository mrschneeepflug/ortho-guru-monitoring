import { ApiProperty } from '@nestjs/swagger';

export class TagAnalyticsResponseDto {
  @ApiProperty({ description: 'Tagging rate as a percentage (0-100)' })
  taggingRate: number;

  @ApiProperty({ description: 'Discount percentage based on tagging rate tier' })
  discountPercent: number;

  @ApiProperty({ description: 'Total scan sessions in the period' })
  totalSessions: number;

  @ApiProperty({ description: 'Number of sessions that have been tagged' })
  taggedSessions: number;

  @ApiProperty({ description: 'Rolling period used for calculation', example: '30d' })
  period: string;
}
