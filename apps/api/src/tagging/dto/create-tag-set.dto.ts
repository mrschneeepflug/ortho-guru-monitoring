import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsInt,
  IsString,
  IsBoolean,
  IsArray,
  IsOptional,
  Min,
  Max,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateTagSetDto {
  @ApiProperty({ description: 'Overall tracking score (1=good, 2=fair, 3=poor)', minimum: 1, maximum: 3 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(3)
  overallTracking: number;

  @ApiPropertyOptional({ description: 'Aligner fit score (1=good, 2=fair, 3=poor)', minimum: 1, maximum: 3 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(3)
  alignerFit?: number;

  @ApiProperty({ description: 'Oral hygiene score (1=good, 2=fair, 3=poor)', minimum: 1, maximum: 3 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(3)
  oralHygiene: number;

  @ApiPropertyOptional({ description: 'Detailed tag labels', default: [] })
  @IsOptional()
  @IsArray()
  detailTags?: string[];

  @ApiPropertyOptional({ description: 'Action taken by the reviewer' })
  @IsOptional()
  @IsString()
  actionTaken?: string;

  @ApiPropertyOptional({ description: 'Additional notes' })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional({ description: 'Whether tags were suggested by AI', default: false })
  @IsOptional()
  @IsBoolean()
  aiSuggested?: boolean;

  @ApiPropertyOptional({ description: 'Whether AI suggestion was overridden', default: false })
  @IsOptional()
  @IsBoolean()
  aiOverridden?: boolean;
}
