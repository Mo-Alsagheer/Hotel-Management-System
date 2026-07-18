import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Request } from 'express';
import { UserRole } from '../../modules/user/schemas/user.schema';

export class ICurrentUser {
  userId: string;
  email: string;
  role: UserRole;
}

export const CurrentUser = createParamDecorator(
  (_data: unknown, context: ExecutionContext): ICurrentUser | undefined => {
    const request = context
      .switchToHttp()
      .getRequest<Request & { user?: ICurrentUser }>();
    return request.user;
  },
);
