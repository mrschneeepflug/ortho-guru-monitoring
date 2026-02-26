import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiConsumes,
  ApiBody,
} from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { ImageType } from '@prisma/client';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { JwtPayload } from '../common/interfaces/jwt-payload.interface';
import { UploadService } from './upload.service';
import { UploadUrlRequestDto } from './dto/upload-url-request.dto';
import { UploadUrlResponseDto } from './dto/upload-url-response.dto';
import { ConfirmUploadDto } from './dto/confirm-upload.dto';

@ApiTags('scans')
@ApiBearerAuth()
@Controller('scans')
export class UploadController {
  constructor(private readonly uploadService: UploadService) {}

  /**
   * Generate a presigned upload URL for direct-to-storage upload.
   */
  @Post('upload/upload-url')
  @ApiOperation({ summary: 'Get a presigned upload URL for a scan image' })
  @ApiCreatedResponse({ type: UploadUrlResponseDto })
  getUploadUrl(
    @Body() dto: UploadUrlRequestDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.uploadService.generateUploadUrl(dto.sessionId, dto.imageType, user.practiceId);
  }

  /**
   * Confirm that a direct-to-storage upload completed.
   * Creates the ScanImage record.
   */
  @Post('upload/confirm')
  @ApiOperation({ summary: 'Confirm a completed direct-to-storage upload' })
  @ApiCreatedResponse({ description: 'ScanImage record created' })
  confirmUpload(
    @Body() dto: ConfirmUploadDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.uploadService.confirmUpload(
      dto.sessionId,
      dto.imageType,
      dto.key,
      user.practiceId,
    );
  }

  /**
   * Handle a local file upload via Multer (fallback when OCI is not configured).
   */
  @Post('upload')
  @ApiOperation({ summary: 'Upload a scan image file (multipart)' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: { type: 'string', format: 'binary' },
        sessionId: { type: 'string' },
        imageType: { type: 'string', enum: Object.values(ImageType) },
      },
      required: ['file', 'sessionId', 'imageType'],
    },
  })
  @UseInterceptors(FileInterceptor('file'))
  handleUpload(
    @UploadedFile() file: Express.Multer.File,
    @Body('sessionId') sessionId: string,
    @Body('imageType') imageType: ImageType,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.uploadService.handleLocalUpload(sessionId, imageType, file, user.practiceId);
  }

  /**
   * Get a pre-signed download URL for viewing a scan image.
   */
  @Get('images/:id/url')
  @ApiOperation({ summary: 'Get a pre-signed download URL for a scan image' })
  @ApiOkResponse({ description: 'Pre-signed download URL' })
  getImageDownloadUrl(
    @Param('id') id: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.uploadService.getImageUrl(id, user.practiceId);
  }
}
