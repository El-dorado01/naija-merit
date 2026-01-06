import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { StudentModule } from './student/student.module';
import { InstitutionModule } from './institution/institution.module';
import { AcademicRecordModule } from './academic-record/academic-record.module';
import { ExtracurricularModule } from './extracurricular/extracurricular.module';
import { RankingModule } from './ranking/ranking.module';
import { AuthModule } from './auth/auth.module';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';
import { ProfileModule } from './profile/profile.module';
import { UserModule } from './user/user.module';
import { AccessRequestModule } from './access-request/access-request.module';
import { EventModule } from './event/event.module';
import { AdminModule } from './admin/admin.module';
import { RecruitmentModule } from './recruitment/recruitment.module';
import { ProgrammeModule } from './programme/programme.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    // Only serve static files in non-serverless environments
    // In serverless (Vercel), files are stored as data URLs or in cloud storage
    ...(process.env.VERCEL
      ? []
      : [
          ServeStaticModule.forRoot({
            rootPath: join(__dirname, '..', 'uploads'),
            serveRoot: '/uploads',
          }),
        ]),
    PrismaModule,
    StudentModule,
    InstitutionModule,
    AcademicRecordModule,
    ExtracurricularModule,
    RankingModule,
    AuthModule,
    ProfileModule,
    UserModule,
    AccessRequestModule,
    EventModule,
    AdminModule,
    RecruitmentModule,
    ProgrammeModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
