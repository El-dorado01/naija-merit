// src/app.service.ts

import { Injectable } from '@nestjs/common';
import { PrismaService } from './prisma/prisma.service';

@Injectable()
export class AppService {
  constructor(private prisma: PrismaService) {}

  async testDb() {
    try {
      const ninCount = await this.prisma.nin.count();
      return { message: 'DB connected!', ninRecords: ninCount };
    } catch (error) {
      console.error('DB query failed:', error);
      throw error;
    }
  }

  getHello(): string {
    return 'Hello World!';
  }
}
