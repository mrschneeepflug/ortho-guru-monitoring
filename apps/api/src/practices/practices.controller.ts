import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { PracticesService } from './practices.service';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { JwtPayload } from '../common/interfaces/jwt-payload.interface';
import { CreatePracticeDto } from './dto/create-practice.dto';
import { UpdatePracticeDto } from './dto/update-practice.dto';
import { UpdatePracticeSettingsDto } from './dto/update-practice-settings.dto';

@ApiTags('practices')
@ApiBearerAuth()
@Controller('practices')
export class PracticesController {
  constructor(private readonly practicesService: PracticesService) {}

  @Get()
  findAll(@CurrentUser() user: JwtPayload) {
    return this.practicesService.findAll(user);
  }

  @Get(':id')
  findOne(
    @Param('id') id: string,
    @CurrentUser('practiceId') practiceId: string,
  ) {
    return this.practicesService.findOne(id, practiceId);
  }

  @Post()
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  create(@Body() dto: CreatePracticeDto) {
    return this.practicesService.create(dto);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() dto: UpdatePracticeDto,
    @CurrentUser('practiceId') practiceId: string,
  ) {
    return this.practicesService.update(id, dto, practiceId);
  }

  @Patch(':id/settings')
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  updateSettings(
    @Param('id') id: string,
    @Body() dto: UpdatePracticeSettingsDto,
    @CurrentUser('practiceId') practiceId: string,
  ) {
    return this.practicesService.updateSettings(id, practiceId, dto);
  }
}
