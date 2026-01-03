import {
  Injectable,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import { randomUUID } from 'crypto';

@Injectable()
export class InstitutionService {
  constructor(private prisma: PrismaService) {}

  async create(data: {
    name: string;
    type: string;
    address?: string;
    state?: string;
  }) {
    // Generate Credentials
    const loginId = `admin_${randomUUID().split('-')[0]}@${data.name.replace(/\s+/g, '').toLowerCase()}.com`;
    // const password = randomUUID().split('-')[0] + '123!';
    const password = 'Password@123'; // Hardcoded for simplicity/demo as requested "toggled and viewed".

    const hashedPassword = await bcrypt.hash(password, 10);

    // Prevent duplicates
    const existing = await this.prisma.institution.findFirst({
      where: {
        name: { equals: data.name, mode: 'insensitive' },
        type: data.type,
      },
    });

    if (existing) {
      throw new ConflictException(
        `An institution with the name "${data.name}" and type "${data.type}" already exists.`,
      );
    }

    const institution = await this.prisma.institution.create({ data });

    // Create School Admin Profile
    const adminProfile = await this.prisma.profile.create({
      data: {
        fullName: `${data.name} Admin`,
        email: loginId,
        password: hashedPassword,
        role: 'school_admin',
        isVerified: true, // Auto-verified
        isAdminVerified: true, // Institutions are pre-approved
        memberships: {
          create: {
            institutionId: institution.id,
            role: 'school_admin',
            isVerified: true,
          },
        },
      },
    });

    return {
      institution,
      credentials: {
        loginId,
        password, // Returning raw password ONCE
      },
    };
  }

  async findAll() {
    return this.prisma.institution.findMany();
  }

  async findOne(id: string) {
    const institution = await this.prisma.institution.findUnique({
      where: { id },
    });

    if (!institution) throw new NotFoundException('Institution not found');
    return institution;
  }

  async getStudents(institutionId: string, page: number = 1, search?: string) {
    const limit = 10;
    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      this.prisma.institutionMember.findMany({
        where: {
          institutionId,
          role: 'student',
          ...(search
            ? {
                profile: {
                  OR: [
                    { fullName: { contains: search, mode: 'insensitive' } },
                    { email: { contains: search, mode: 'insensitive' } },
                    { nin: { contains: search } },
                  ],
                },
              }
            : {}),
        },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          profile: {
            select: {
              id: true,
              fullName: true,
              email: true,
              isVerified: true,
              stateOfOrigin: true,
              avatar: true,
              nin: true,
              createdAt: true,
            },
          },
        },
      }),
      this.prisma.institutionMember.count({
        where: {
          institutionId,
          role: 'student',
          ...(search
            ? {
                profile: {
                  OR: [
                    { fullName: { contains: search, mode: 'insensitive' } },
                    { email: { contains: search, mode: 'insensitive' } },
                    { nin: { contains: search } },
                  ],
                },
              }
            : {}),
        },
      }),
    ]);

    return {
      data: data.map((m) => m.profile),
      meta: {
        total,
        page,
        lastPage: Math.ceil(total / limit),
      },
    };
  }

  async registerStudents(institutionId: string, students: any[]) {
    const institution = await this.prisma.institution.findUnique({
      where: { id: institutionId },
    });
    if (!institution) throw new NotFoundException('Institution not found');

    const results: any[] = [];

    for (const s of students) {
      let student: any = null;

      // 1. Try finding by NIN
      if (s.nin) {
        student = await this.prisma.profile.findUnique({
          where: { nin: s.nin },
        });
      }

      // 2. Try finding by Email if not found by NIN
      if (!student && s.email) {
        student = await this.prisma.profile.findUnique({
          where: { email: s.email },
        });
      }

      // 3. Create or Update Profile
      if (student) {
        // If profile exists, link it to institution
        await this.prisma.institutionMember.upsert({
          where: {
            institutionId_profileId: {
              institutionId,
              profileId: student.id,
            },
          },
          update: {},
          create: {
            institutionId,
            profileId: student.id,
            role: 'student',
            isVerified: true,
          },
        });

        results.push({ email: s.email, status: 'Linked', id: student.id });
      } else {
        // Create new profile and link
        const newPassword = await bcrypt.hash('Student@123', 10);

        const newProfile = await this.prisma.profile.create({
          data: {
            email: s.email,
            fullName: s.fullName || s.name,
            nin: s.nin,
            role: 'student',
            password: newPassword,
            isVerified: true,
            memberships: {
              create: {
                institutionId,
                role: 'student',
                isVerified: true,
              },
            },
          },
        });

        results.push({ email: s.email, status: 'Created', id: newProfile.id });
      }
    }

    return { processed: results.length, details: results };
  }

  async getAnalytics(institutionId: string) {
    const studentCount = await this.prisma.institutionMember.count({
      where: { institutionId, role: 'student' },
    });
    const recordCount = await this.prisma.academicRecord.count({
      where: { institutionId },
    });

    return {
      studentCount,
      recordCount,
    };
  }

  async update(
    id: string,
    data: { name?: string; type?: string; address?: string; state?: string },
  ) {
    const institution = await this.prisma.institution.findUnique({
      where: { id },
    });
    if (!institution) throw new NotFoundException('Institution not found');

    return this.prisma.institution.update({
      where: { id },
      data,
    });
  }

  async delete(id: string) {
    const institution = await this.prisma.institution.findUnique({
      where: { id },
    });
    if (!institution) throw new NotFoundException('Institution not found');

    // Manually delete members first
    await this.prisma.institutionMember.deleteMany({
      where: { institutionId: id },
    });

    return this.prisma.institution.delete({ where: { id } });
  }

  async updateSettings(id: string, data: { cgpaScale?: number }) {
    const institution = await this.prisma.institution.findUnique({
      where: { id },
    });
    if (!institution) throw new NotFoundException('Institution not found');

    return this.prisma.institution.update({
      where: { id },
      data: {
        cgpaScale: data.cgpaScale,
      },
    });
  }
}
