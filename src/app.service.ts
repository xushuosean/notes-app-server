import { HttpService } from '@nestjs/axios';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AppService {
  constructor(private readonly httpService: HttpService, private configService: ConfigService) {
    
  }
  async getAuthCallback(code: string) {
    console.log(this.configService.get<string>('clientId'), this.configService.get<string>('clientSecret'), code)
    return 'h'
  }
}
