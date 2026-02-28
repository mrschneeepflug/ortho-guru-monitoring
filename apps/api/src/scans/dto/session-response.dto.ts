import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ScanStatus, ImageType, AttachmentCheck } from '@prisma/client';

export class ScanImageResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  sessionId: string;

  @ApiProperty({ enum: ImageType })
  imageType: ImageType;

  @ApiPropertyOptional({ nullable: true })
  s3Key: string | null;

  @ApiPropertyOptional({ nullable: true })
  thumbnailKey: string | null;

  @ApiPropertyOptional({ nullable: true })
  localPath: string | null;

  @ApiPropertyOptional({ nullable: true })
  qualityScore: number | null;

  @ApiProperty()
  createdAt: Date;
}

export class TagSetResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  sessionId: string;

  @ApiProperty()
  taggedById: string;

  @ApiProperty({ description: '1-3: good, fair, poor' })
  overallTracking: number;

  @ApiPropertyOptional({ nullable: true, description: '1-3: good, fair, poor' })
  alignerFit: number | null;

  @ApiProperty({ description: '1-3: good, fair, poor' })
  oralHygiene: number;

  @ApiProperty({ type: [Object] })
  detailTags: unknown[];

  @ApiPropertyOptional({ nullable: true })
  actionTaken: string | null;

  @ApiPropertyOptional({ nullable: true })
  notes: string | null;

  @ApiProperty()
  aiSuggested: boolean;

  @ApiProperty()
  aiOverridden: boolean;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}

export class SessionPatientDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;
}

export class SessionResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  patientId: string;

  @ApiProperty({ enum: ScanStatus })
  status: ScanStatus;

  @ApiProperty()
  imageCount: number;

  @ApiPropertyOptional({ nullable: true, description: 'Patient self-report: current tray number' })
  reportTrayNumber: number | null;

  @ApiPropertyOptional({ nullable: true, description: 'Patient self-report: aligner fit (1=Good, 2=Fair, 3=Poor)' })
  reportAlignerFit: number | null;

  @ApiPropertyOptional({ nullable: true, description: 'Patient self-report: daily wear time in hours' })
  reportWearTimeHrs: number | null;

  @ApiPropertyOptional({ nullable: true, enum: AttachmentCheck, description: 'Patient self-report: attachments check' })
  reportAttachments: AttachmentCheck | null;

  @ApiPropertyOptional({ nullable: true, description: 'Patient self-report: additional notes' })
  reportNotes: string | null;

  @ApiPropertyOptional({ nullable: true })
  reviewedById: string | null;

  @ApiPropertyOptional({ nullable: true })
  reviewedAt: Date | null;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  @ApiPropertyOptional({ type: SessionPatientDto })
  patient?: SessionPatientDto;

  @ApiPropertyOptional({ type: [ScanImageResponseDto] })
  images?: ScanImageResponseDto[];

  @ApiPropertyOptional({ type: TagSetResponseDto, nullable: true })
  tagSet?: TagSetResponseDto | null;
}
