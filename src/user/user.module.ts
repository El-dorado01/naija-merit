import { Module } from '@nestjs/common';
import { UserController } from './user.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { AccessRequestModule } from '../access-request/access-request.module';

@Module({
  imports: [PrismaModule, AccessRequestModule],
  controllers: [UserController],
})
export class UserModule {}
