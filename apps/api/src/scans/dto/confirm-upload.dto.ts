import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsEnum } from 'class-validator';
import { ImageType } from '@prisma/client';

export class ConfirmUploadDto {
  @ApiProperty({ description: 'ID of the scan session' })
  @IsString()
  @IsNotEmpty()
  sessionId: string;

  @ApiProperty({ description: 'Type of dental image', enum: ImageType })
  @IsEnum(ImageType)
  imageType: ImageType;

  @ApiProperty({ description: 'S3 key returned from upload-url endpoint' })
  @IsString()
  @IsNotEmpty()
  key: string;
}
