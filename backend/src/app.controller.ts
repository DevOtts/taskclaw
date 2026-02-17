import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';
import { APP_VERSION } from './version';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Get('health')
  healthCheck() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
    };
  }

  @Get('version')
  getVersion() {
    return {
      version: APP_VERSION,
      edition: process.env.EDITION || 'community',
    };
  }
}
