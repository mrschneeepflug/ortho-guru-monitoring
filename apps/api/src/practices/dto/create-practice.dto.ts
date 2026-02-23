import { IsString, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreatePracticeDto {
  @ApiProperty({ description: 'Practice name' })
  @IsString()
  name: string;

  @ApiPropertyOptional({ description: 'Practice address' })
  @IsOptional()
  @IsString()
  address?: string;

  @ApiPropertyOptional({ description: 'Practice phone number' })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional({
    description: 'Subscription tier',
    default: 'basic',
  })
  @IsOptional()
  @IsString()
  subscriptionTier?: string = 'basic';
}
