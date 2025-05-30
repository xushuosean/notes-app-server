import { Controller, Get, Post, Query, Redirect, Res } from '@nestjs/common';
import { Response } from 'express';
import { Cookies } from '../decorators/cookie.decorator';
import { AuthService } from './auth.service';

@Controller('api')
export class AuthController {
  constructor(private readonly appService: AuthService) {}

  @Get('/auth/callback')
  @Redirect('http://localhost:8000', 301)
  async authCallback(@Query('code') code: string, @Res({ passthrough: true }) response: Response) {
    const cookieOptions = await this.appService.getAuthCallback(code);
    response.cookie(cookieOptions.name, cookieOptions.value, cookieOptions.options);
  }

  @Post('/auth/login')
  async authLogin(@Cookies('githubAccessToken') token: string) {
    await this.appService.getAuthLogin(token);
  }
}
