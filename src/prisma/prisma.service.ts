// src/prisma/prisma.service.ts

import { Injectable, OnModuleInit } from '@nestjs/common';
// import { PrismaClient } from '../generated/prisma'; // Your custom output path
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from 'src/generated/prisma';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
  constructor() {
    // Required in Prisma 7+: Pass the pg adapter with your pooled DATABASE_URL
    const adapter = new PrismaPg({
      connectionString: process.env.DATABASE_URL, // Your pooled Supabase URL with ?pgbouncer=true
    });

    // Enable Prisma runtime logs to help diagnose connection/query failures
    super({ adapter, log: ['info', 'warn', 'error'] });
  }

  async onModuleInit() {
    // Optional: Test connection on startup
    try {
      await this.$connect();
      console.log('✅ Prisma connected to Supabase successfully!');
    } catch (error) {
      console.error('❌ Prisma connection failed:', error);
      throw error; // let NestJS know the app failed to start
    }
  }
}
