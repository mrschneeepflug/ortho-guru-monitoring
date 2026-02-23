import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsEnum } from 'class-validator';
import { ImageType } from '@prisma/client';

export class UploadUrlRequestDto {
  @ApiProperty({ description: 'ID of the scan session to upload an image for' })
  @IsString()
  @IsNotEmpty()
  sessionId: string;

  @ApiProperty({
    description: 'Type of dental image',
    enum: ImageType,
  })
  @IsEnum(ImageType)
  imageType: ImageType;
}
