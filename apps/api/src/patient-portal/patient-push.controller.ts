import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  UseGuards,
  Headers,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { Public } from '../common/decorators/public.decorator';
import { PatientAuthGuard } from '../common/guards/patient-auth.guard';
import { CurrentPatient } from '../common/decorators/current-patient.decorator';
import { PatientJwtPayload } from '../common/interfaces/jwt-payload.interface';
import { NotificationsService } from '../notifications/notifications.service';
import {
  SubscribePushDto,
  UnsubscribePushDto,
} from '../notifications/dto/subscribe-push.dto';

@ApiTags('patient-push')
@Controller('patient/push')
export class PatientPushController {
  constructor(private readonly notifications: NotificationsService) {}

  @Get('vapid-public-key')
  @Public()
  @ApiOperation({ summary: 'Get VAPID public key for push subscription' })
  getVapidPublicKey() {
    return { key: this.notifications.getVapidPublicKey() };
  }

  @Post('subscribe')
  @ApiBearerAuth()
  @UseGuards(PatientAuthGuard)
  @ApiOperation({ summary: 'Subscribe to push notifications' })
  subscribe(
    @CurrentPatient() patient: PatientJwtPayload,
    @Body() dto: SubscribePushDto,
    @Headers('user-agent') userAgent?: string,
  ) {
    return this.notifications.subscribe(
      patient.sub,
      { endpoint: dto.endpoint, keys: dto.keys },
      dto.userAgent || userAgent,
    );
  }

  @Delete('unsubscribe')
  @ApiBearerAuth()
  @UseGuards(PatientAuthGuard)
  @ApiOperation({ summary: 'Unsubscribe from push notifications' })
  unsubscribe(
    @CurrentPatient() patient: PatientJwtPayload,
    @Body() dto: UnsubscribePushDto,
  ) {
    return this.notifications.unsubscribe(patient.sub, dto.endpoint);
  }
}
