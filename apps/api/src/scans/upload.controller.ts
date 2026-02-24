import {
  Controller,
  Post,
  Body,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiCreatedResponse,
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

@ApiTags('scans')
@ApiBearerAuth()
@Controller('scans/upload')
export class UploadController {
  constructor(private readonly uploadService: UploadService) {}

  /**
   * Generate a presigned upload URL stub.
   * TODO: Replace with S3 integration
   */
  @Post('upload-url')
  @ApiOperation({ summary: 'Get a presigned upload URL for a scan image' })
  @ApiCreatedResponse({ type: UploadUrlResponseDto })
  getUploadUrl(
    @Body() dto: UploadUrlRequestDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.uploadService.generateUploadUrl(dto.sessionId, dto.imageType, user.practiceId);
  }

  /**
   * Handle a local file upload via Multer.
   * TODO: Replace with S3 integration
   */
  @Post()
  @ApiOperation({ summary: 'Upload a scan image file (local storage)' })
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
}
