import { Module } from '@nestjs/common';
import { AccessRequestService } from './access-request.service';
import { AccessRequestController } from './access-request.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  providers: [AccessRequestService],
  controllers: [AccessRequestController],
  exports: [AccessRequestService],
})
export class AccessRequestModule {}
