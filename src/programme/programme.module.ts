import { Module } from '@nestjs/common';
import { ProgrammeService } from './programme.service';
import { ProgrammeController } from './programme.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [ProgrammeController],
  providers: [ProgrammeService],
  exports: [ProgrammeService],
})
export class ProgrammeModule {}
