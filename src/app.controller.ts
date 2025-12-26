// src/app.controller.ts

import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Get('test-db')
  testDb(): Promise<{ message: string; ninRecords: number }> {
    return this.appService.testDb();
  }
}
