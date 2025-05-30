import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const User = createParamDecorator((_: string, ctx: ExecutionContext) => {
  const response = ctx.switchToHttp().getResponse();
  return response.locals.userData
});