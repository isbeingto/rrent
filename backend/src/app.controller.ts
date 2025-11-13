import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Get('health')
  getHealth() {
    return this.appService.getHealth();
  }

  @Get('api')
  getApi() {
    return {
      message: 'RRent API',
      version: '0.0.1',
      endpoints: [
        { path: '/', method: 'GET', description: 'Welcome message' },
        { path: '/health', method: 'GET', description: 'Health check' },
        { path: '/api', method: 'GET', description: 'API info' },
      ],
    };
  }
}
