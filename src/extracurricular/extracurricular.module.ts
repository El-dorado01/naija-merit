import { Module } from '@nestjs/common';
import { ExtracurricularService } from './extracurricular.service';
import { ExtracurricularController } from './extracurricular.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { AccessRequestModule } from '../access-request/access-request.module';

@Module({
  imports: [PrismaModule, AccessRequestModule],
  providers: [ExtracurricularService],
  controllers: [ExtracurricularController]
})
export class ExtracurricularModule {}
