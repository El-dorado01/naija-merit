// src/prisma/prisma.service.ts

import { Injectable, OnModuleInit } from '@nestjs/common';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';

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
    // In serverless environments, connect lazily to avoid cold start issues
    // Connection will be established on first query if not already connected
    if (process.env.VERCEL) {
      // In Vercel, we'll connect on-demand to reduce cold start time
      console.log('⚠️  Serverless mode: Prisma will connect on first query');
      return;
    }
    
    // In non-serverless environments, connect immediately
    try {
      await this.$connect();
      console.log('✅ Prisma connected to database successfully!');
    } catch (error) {
      console.error('❌ Prisma connection failed:', error);
      throw error; // let NestJS know the app failed to start
    }
  }
}
