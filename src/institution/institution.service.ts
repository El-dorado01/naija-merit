import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import { randomUUID } from 'crypto';

@Injectable()
export class InstitutionService {
  constructor(private prisma: PrismaService) {}

  async create(data: { name: string; type: string; address?: string; state?: string }) {
    // Generate Credentials
    const loginId = `admin_${randomUUID().split('-')[0]}@${data.name.replace(/\s+/g, '').toLowerCase()}.com`;
    // const password = randomUUID().split('-')[0] + '123!';
    const password = 'Password@123'; // Hardcoded for simplicity/demo as requested "toggled and viewed". 
    // In prod, use random.
    
    const hashedPassword = await bcrypt.hash(password, 10);

    const institution = await this.prisma.institution.create({ data });

    // Create School Admin Profile
    const adminProfile = await this.prisma.profile.create({
      data: {
        fullName: `${data.name} Admin`,
        email: loginId,
        password: hashedPassword,
        role: 'school_admin',
        institutionId: institution.id,
        isVerified: true, // Auto-verified
      }
    });

    return {
      institution,
      credentials: {
        loginId,
        password // Returning raw password ONCE
      }
    };
  }

  async findAll() {
    return this.prisma.institution.findMany({ include: { members: true } });
  }

  async registerStudents(institutionId: string, students: any[]) {
     const institution = await this.prisma.institution.findUnique({ where: { id: institutionId } });
     if (!institution) throw new NotFoundException('Institution not found');

     const results: any[] = [];

     for (const s of students) {
        let student: any = null; // Fix type inference

        // 1. Try finding by NIN
        if (s.nin) {
          student = await this.prisma.profile.findUnique({ where: { nin: s.nin } });
        }
        
        // 2. Try finding by Email if not found by NIN
        if (!student && s.email) {
          student = await this.prisma.profile.findUnique({ where: { email: s.email } });
        }

        if (student) {
          // Exists: Enroll them in this institution (Link them)
          await this.prisma.profile.update({
            where: { id: student.id },
            data: { institutionId }
          });
          results.push({ ...student, status: 'enrolled' });
        } else {
          // Does not exist: Create "Skeletal" Profile for future claiming
          // No password, just NIN + Name + Institution
          try {
            const newStudent = await this.prisma.profile.create({
              data: {
                 nin: s.nin,
                 email: s.email || undefined, // Email optional
                 fullName: s.fullName,
                 role: 'student',
                 institutionId,
                 password: null, // No password, must act as "unclaimed"
                 isVerified: true 
              }
            });
            results.push({ ...newStudent, status: 'created' });
          } catch (e) {
             console.error(e);
          }
        }
     }
     return { count: results.length, students: results };
  }

  async getAnalytics(institutionId: string) {
    const studentCount = await this.prisma.profile.count({ where: { institutionId, role: 'student' } });
    const recordCount = await this.prisma.academicRecord.count({ where: { institutionId } });
    
    return {
      studentCount,
      recordCount,
    };
  }
}
