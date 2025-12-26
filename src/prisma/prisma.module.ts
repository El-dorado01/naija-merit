import { Global, Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';

@Global() // Makes it available app-wide without importing everywhere
@Module({
  providers: [PrismaService],
  exports: [PrismaService],
})
export class PrismaModule {}
