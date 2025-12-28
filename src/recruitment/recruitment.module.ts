import { Module } from '@nestjs/common';
import { RecruitmentService } from './recruitment.service';
import { CompanyController, RecruitmentController, StudentSearchController } from './recruitment.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { AccessRequestModule } from '../access-request/access-request.module';
import { RankingModule } from '../ranking/ranking.module';

@Module({
  imports: [PrismaModule, AccessRequestModule, RankingModule],
  controllers: [CompanyController, RecruitmentController, StudentSearchController],
  providers: [RecruitmentService]
})
export class RecruitmentModule {}
