import { ApiProperty } from '@nestjs/swagger';

export class UploadUrlResponseDto {
  @ApiProperty({ description: 'Presigned upload URL (or local path stub)' })
  url: string;

  @ApiProperty({ description: 'Storage key for the uploaded file' })
  key: string;
}
