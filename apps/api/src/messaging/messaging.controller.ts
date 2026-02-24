import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
} from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiOkResponse,
  ApiCreatedResponse,
} from '@nestjs/swagger';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { JwtPayload } from '../common/interfaces/jwt-payload.interface';
import { MessagingService } from './messaging.service';
import { CreateThreadDto } from './dto/create-thread.dto';
import { CreateMessageDto } from './dto/create-message.dto';
import { ThreadResponseDto } from './dto/thread-response.dto';
import { MessageResponseDto } from './dto/message-response.dto';

@ApiTags('messaging')
@ApiBearerAuth()
@Controller('messaging')
export class MessagingController {
  constructor(private readonly messagingService: MessagingService) {}

  @Get('threads')
  @ApiOperation({ summary: 'List all message threads for the current practice' })
  @ApiOkResponse({ type: [ThreadResponseDto] })
  findAllThreads(@CurrentUser() user: JwtPayload) {
    return this.messagingService.findAllThreads(user.practiceId);
  }

  @Get('threads/:id')
  @ApiOperation({ summary: 'Get a single thread with all messages' })
  @ApiOkResponse({ type: ThreadResponseDto })
  findThread(
    @Param('id') id: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.messagingService.findThread(id, user.practiceId);
  }

  @Post('threads')
  @ApiOperation({ summary: 'Create a new message thread' })
  @ApiCreatedResponse({ type: ThreadResponseDto })
  createThread(
    @Body() dto: CreateThreadDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.messagingService.createThread(dto, user.practiceId);
  }

  @Post('messages')
  @ApiOperation({ summary: 'Send a message in a thread' })
  @ApiCreatedResponse({ type: MessageResponseDto })
  sendMessage(
    @Body() dto: CreateMessageDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.messagingService.sendMessage(dto, user.sub, user.role, user.practiceId);
  }

  @Patch('messages/:id/read')
  @ApiOperation({ summary: 'Mark a message as read' })
  @ApiOkResponse({ type: MessageResponseDto })
  markAsRead(
    @Param('id') id: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.messagingService.markAsRead(id, user.sub, user.practiceId);
  }
}
