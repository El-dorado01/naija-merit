import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class SuperAdminGuard implements CanActivate {
  constructor(private prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      throw new ForbiddenException('User not authenticated');
    }

    const profile = await this.prisma.profile.findUnique({ 
      where: { id: user.userId },
      select: { role: true }
    });

    if (profile?.role !== 'super_admin') {
      throw new ForbiddenException('Super admin access required');
    }

    return true;
  }
}
