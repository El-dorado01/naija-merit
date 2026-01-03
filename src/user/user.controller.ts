import {
  Controller,
  Get,
  Param,
  Query,
  NotFoundException,
  UseGuards,
  Request,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AccessRequestService } from '../access-request/access-request.service';

@Controller('users')
@UseGuards(JwtAuthGuard)
export class UserController {
  constructor(
    private prisma: PrismaService,
    private accessService: AccessRequestService,
  ) {}

  @Get()
  async findAll(
    @Query('role') role?: string,
    @Query('verified') verified?: string,
  ) {
    const where: any = {};
    if (role) where.role = role;
    if (verified === 'true') where.isVerified = true;

    return this.prisma.profile.findMany({
      where,
      select: {
        id: true,
        fullName: true,
        role: true,
        avatar: true,
        isVerified: true,
        stateOfOrigin: true,
      },
    });
  }

  @Get(':id')
  async findOne(@Request() req, @Param('id') id: string) {
    const currentUser = req.user;
    const isSelf = currentUser.userId === id;
    const isAdmin = ['admin', 'super_admin', 'school_admin'].includes(
      currentUser.role,
    );

    let hasAccess = isSelf || isAdmin;

    if (!hasAccess && currentUser.role === 'recruiter') {
      hasAccess = await this.accessService.hasAccess(currentUser.userId, id);
    }

    const user = await this.prisma.profile.findUnique({
      where: { id },
      include: {
        academicRecords: hasAccess, // Only include if access granted
        extracurriculars: hasAccess,
        eventParticipations: hasAccess,
      },
    });

    if (!user) throw new NotFoundException('User not found');

    if (!hasAccess) {
      // Redact sensitive info
      return {
        id: user.id,
        fullName: user.fullName,
        role: user.role,
        avatar: user.avatar,
        isVerified: user.isVerified,
        stateOfOrigin: user.stateOfOrigin,
        message: 'Full profile hidden. Request access to view details.',
      };
    }

    return user;
  }
}
