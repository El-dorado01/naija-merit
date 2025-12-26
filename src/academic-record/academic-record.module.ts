import { Module } from '@nestjs/common';
import { AcademicRecordService } from './academic-record.service';
import { AcademicRecordController } from './academic-record.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { AccessRequestModule } from '../access-request/access-request.module';

@Module({
  imports: [PrismaModule, AccessRequestModule],
  providers: [AcademicRecordService],
  controllers: [AcademicRecordController]
})
export class AcademicRecordModule {}
