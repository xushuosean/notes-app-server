import { Controller, Get, Query } from '@nestjs/common';
import { AppService } from './app.service';

@Controller('api')
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get('/auth/callback')
  async authCallback(@Query('code') code: string): Promise<string> {
    console.log(code, 'code')
    return await this.appService.getAuthCallback(code);
  }
}
