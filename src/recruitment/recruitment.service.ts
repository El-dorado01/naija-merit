import { Injectable, NotFoundException, ForbiddenException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AccessRequestService } from '../access-request/access-request.service';
import { RankingService } from '../ranking/ranking.service';

@Injectable()
export class RecruitmentService {
  constructor(
    private prisma: PrismaService,
    private accessRequestService: AccessRequestService,
    private rankingService: RankingService
  ) {}

  async registerCompany(recruiterId: string, data: { name: string; industry?: string; website?: string; description?: string }) {
    // Check if recruiter already has a company
    const existing = await this.prisma.company.findUnique({ where: { profileId: recruiterId } });
    if (existing) throw new ConflictException('Company already registered for this recruiter');

    // Verify recruiter role
    const recruiter = await this.prisma.profile.findUnique({ where: { id: recruiterId } });
    if (recruiter?.role !== 'recruiter' && recruiter?.role !== 'company') {
      throw new ForbiddenException('Only recruiters/companies can register companies');
    }

    return this.prisma.company.create({
      data: {
        ...data,
        profileId: recruiterId
      }
    });
  }

  async advancedSearch(
    recruiterId: string,
    filters: {
      gpa?: number;
      skills?: string;
      region?: string;
      level?: string;
      minScore?: number;
    }
  ) {
    // Build where clause
    const where: any = {
      role: 'student',
      isOpenToRecruiters: true, // CRITICAL: Only students open to recruiters
    };

    if (filters.region) {
      where.stateOfOrigin = { contains: filters.region, mode: 'insensitive' };
    }

    // Get students matching basic criteria
    let students = await this.prisma.profile.findMany({
      where,
      select: {
        id: true,
        fullName: true,
        email: true,
        avatar: true,
        stateOfOrigin: true,
        isOpenToRecruiters: true
      }
    });

    // Calculate scores and filter by GPA/minScore
    const studentsWithScores = await Promise.all(
      students.map(async (student) => {
        const scoreData = await this.rankingService.calculateStudentScore(student.id);
        
        // Apply score/GPA filters
        if (filters.minScore && scoreData.totalScore < filters.minScore) {
          return null;
        }
        if (filters.gpa && scoreData.breakdown.cgpa < filters.gpa) {
          return null;
        }

        // Check if recruiter has access to full profile
        const hasAccess = await this.accessRequestService.hasAccess(recruiterId, student.id);

        return {
          ...student,
          score: scoreData.totalScore,
          cgpa: scoreData.breakdown.cgpa,
          hasFullAccess: hasAccess, // Indicates if recruiter can view full profile
        };
      })
    );

    // Filter out nulls and return
    return studentsWithScores.filter(s => s !== null);
  }

  async createShortlist(recruiterId: string, studentIds: string[], notes?: string) {
    // Get recruiter's company
    const company = await this.prisma.company.findUnique({ where: { profileId: recruiterId } });
    if (!company) throw new NotFoundException('Company not found. Please register a company first.');

    // Verify all students are open to recruiters
    const students = await this.prisma.profile.findMany({
      where: {
        id: { in: studentIds },
        role: 'student'
      },
      select: { id: true, isOpenToRecruiters: true }
    });

    const notOpenStudents = students.filter(s => !s.isOpenToRecruiters);
    if (notOpenStudents.length > 0) {
      throw new ForbiddenException(
        `Cannot shortlist students who are not open to recruiters. IDs: ${notOpenStudents.map(s => s.id).join(', ')}`
      );
    }

    // Create shortlist entries
    const shortlists = await Promise.all(
      studentIds.map(studentId =>
        this.prisma.shortlist.upsert({
          where: {
            companyId_studentId: {
              companyId: company.id,
              studentId
            }
          },
          create: {
            companyId: company.id,
            studentId,
            notes,
            status: 'shortlisted'
          },
          update: {
            notes,
            updatedAt: new Date()
          }
        })
      )
    );

    return {
      message: 'Students shortlisted successfully',
      count: shortlists.length,
      shortlists
    };
  }

  async getMyShortlists(recruiterId: string) {
    const company = await this.prisma.company.findUnique({ where: { profileId: recruiterId } });
    if (!company) throw new NotFoundException('Company not found');

    return this.prisma.shortlist.findMany({
      where: { companyId: company.id },
      include: {
        student: {
          select: {
            id: true,
            fullName: true,
            email: true,
            avatar: true,
            stateOfOrigin: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
  }
}
