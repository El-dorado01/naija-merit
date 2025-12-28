import { Injectable, ConflictException, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt';

export interface CreateAdminDto {
  email: string;
  fullName: string;
  password: string;
  permissions: string[];
}

@Injectable()
export class AdminService {
  constructor(private prisma: PrismaService) {}

  async createAdmin(superAdminId: string, data: CreateAdminDto) {
    // Verify creator is super admin
    const creator = await this.prisma.profile.findUnique({ where: { id: superAdminId } });
    if (creator?.role !== 'super_admin') {
      throw new ForbiddenException('Only super admins can create admin accounts');
    }

    // Check if email exists
    const existing = await this.prisma.profile.findUnique({ where: { email: data.email } });
    if (existing) throw new ConflictException('Email already registered');

    const hashedPassword = await bcrypt.hash(data.password, 10);

    return this.prisma.profile.create({
      data: {
        email: data.email,
        fullName: data.fullName,
        password: hashedPassword,
        role: 'admin',
        permissions: data.permissions,
        createdBy: superAdminId,
        isVerified: true
      },
      select: {
        id: true,
        email: true,
        fullName: true,
        role: true,
        permissions: true,
        createdAt: true
      }
    });
  }

  async listAdmins(requesterId: string) {
    // Verify requester is super admin
    const requester = await this.prisma.profile.findUnique({ where: { id: requesterId } });
    if (requester?.role !== 'super_admin') {
      throw new ForbiddenException('Only super admins can list admins');
    }

    return this.prisma.profile.findMany({
      where: {
        OR: [
          { role: 'admin' },
          { role: 'super_admin' }
        ]
      },
      select: {
        id: true,
        email: true,
        fullName: true,
        role: true,
        permissions: true,
        createdBy: true,
        createdAt: true
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  async updatePermissions(superAdminId: string, adminId: string, permissions: string[]) {
    // Verify requester is super admin
    const requester = await this.prisma.profile.findUnique({ where: { id: superAdminId } });
    if (requester?.role !== 'super_admin') {
      throw new ForbiddenException('Only super admins can update permissions');
    }

    const admin = await this.prisma.profile.findUnique({ where: { id: adminId } });
    if (!admin) throw new NotFoundException('Admin not found');
    
    if (admin.role === 'super_admin') {
      throw new ForbiddenException('Cannot modify super admin permissions');
    }

    return this.prisma.profile.update({
      where: { id: adminId },
      data: { permissions },
      select: {
        id: true,
        email: true,
        fullName: true,
        role: true,
        permissions: true
      }
    });
  }

  async deleteAdmin(superAdminId: string, adminId: string) {
    // Verify requester is super admin
    const requester = await this.prisma.profile.findUnique({ where: { id: superAdminId } });
    if (requester?.role !== 'super_admin') {
      throw new ForbiddenException('Only super admins can delete admins');
    }

    const admin = await this.prisma.profile.findUnique({ where: { id: adminId } });
    if (!admin) throw new NotFoundException('Admin not found');
    
    if (admin.role === 'super_admin') {
      throw new ForbiddenException('Cannot delete super admin');
    }

    await this.prisma.profile.delete({ where: { id: adminId } });
    return { message: 'Admin deleted successfully' };
  }

  async hasPermission(userId: string, requiredPermission: string): Promise<boolean> {
    const user = await this.prisma.profile.findUnique({ where: { id: userId } });
    if (!user) return false;

    // Super admins have all permissions
    if (user.role === 'super_admin') return true;

    // Check if admin has specific permission
    if (user.role === 'admin' && user.permissions) {
      const permissions = user.permissions as string[];
      return permissions.includes(requiredPermission);
    }

    return false;
  }

  async approveRole(superAdminId: string, userId: string, newRole: string) {
    // Verify requester is super admin
    const requester = await this.prisma.profile.findUnique({ where: { id: superAdminId } });
    if (requester?.role !== 'super_admin') {
      throw new ForbiddenException('Only super admins can approve roles');
    }

    const user = await this.prisma.profile.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    // Approve the role and mark as verified
    return this.prisma.profile.update({
      where: { id: userId },
      data: {
        role: newRole,
        isVerified: true
      },
      select: {
        id: true,
        email: true,
        fullName: true,
        role: true,
        isVerified: true
      }
    });
  }

  async getAllUsers(superAdminId: string, filters?: { role?: string; isVerified?: boolean }) {
    // Verify requester is super admin
    const requester = await this.prisma.profile.findUnique({ where: { id: superAdminId } });
    if (requester?.role !== 'super_admin') {
      throw new ForbiddenException('Only super admins can view all users');
    }

    const where: any = {};
    if (filters?.role) where.role = filters.role;
    if (filters?.isVerified !== undefined) where.isVerified = filters.isVerified;

    return this.prisma.profile.findMany({
      where,
      select: {
        id: true,
        email: true,
        fullName: true,
        role: true,
        isVerified: true,
        institutionId: true,
        createdAt: true
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  async recognizeEvent(superAdminId: string, eventId: string) {
    // Verify requester is super admin
    const requester = await this.prisma.profile.findUnique({ where: { id: superAdminId } });
    if (requester?.role !== 'super_admin') {
      throw new ForbiddenException('Only super admins can recognize events');
    }

    const event = await this.prisma.event.findUnique({ where: { id: eventId } });
    if (!event) throw new NotFoundException('Event not found');

    return this.prisma.event.update({
      where: { id: eventId },
      data: { isRecognized: true },
      select: {
        id: true,
        name: true,
        type: true,
        isRecognized: true,
        date: true
      }
    });
  }
}
