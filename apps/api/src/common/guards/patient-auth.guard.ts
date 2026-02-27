import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { isPatientPayload } from '../interfaces/jwt-payload.interface';

@Injectable()
export class PatientAuthGuard extends AuthGuard('jwt') implements CanActivate {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    // First run the JWT guard to populate request.user
    const isAuth = await super.canActivate(context);
    if (!isAuth) return false;

    const request = context.switchToHttp().getRequest();
    if (!isPatientPayload(request.user)) {
      throw new ForbiddenException('This endpoint is for patients only');
    }
    return true;
  }
}
