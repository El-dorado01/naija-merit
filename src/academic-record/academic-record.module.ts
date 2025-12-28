import { Module } from '@nestjs/common';
import { AcademicRecordService } from './academic-record.service';
import { AcademicRecordController } from './academic-record.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { AccessRequestModule } from '../access-request/access-request.module';
import { AdminModule } from '../admin/admin.module';

@Module({
  imports: [PrismaModule, AccessRequestModule, AdminModule],
  providers: [AcademicRecordService],
  controllers: [AcademicRecordController]
})
export class AcademicRecordModule {}
