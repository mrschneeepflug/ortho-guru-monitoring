import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { PatientJwtPayload } from '../interfaces/jwt-payload.interface';

export const CurrentPatient = createParamDecorator(
  (data: keyof PatientJwtPayload | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user as PatientJwtPayload;
    return data ? user?.[data] : user;
  },
);
