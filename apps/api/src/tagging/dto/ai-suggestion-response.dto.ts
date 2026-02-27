import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class AiSuggestionResponseDto {
  @ApiProperty({ description: 'Overall tracking score (1=good, 2=fair, 3=poor)', minimum: 1, maximum: 3 })
  overallTracking: number;

  @ApiProperty({ description: 'Aligner fit score (1=good, 2=fair, 3=poor)', minimum: 1, maximum: 3 })
  alignerFit: number;

  @ApiProperty({ description: 'Oral hygiene score (1=good, 2=fair, 3=poor)', minimum: 1, maximum: 3 })
  oralHygiene: number;

  @ApiProperty({ description: 'Suggested detail tags', type: [String] })
  detailTags: string[];

  @ApiPropertyOptional({ description: 'Suggested action' })
  actionTaken: string | null;

  @ApiPropertyOptional({ description: 'AI-generated clinical notes' })
  notes: string | null;

  @ApiProperty({ description: 'AI confidence score (0-1)', minimum: 0, maximum: 1 })
  confidence: number;
}
