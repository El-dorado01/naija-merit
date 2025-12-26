import { Injectable, BadRequestException, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AccessRequestService {
  constructor(private prisma: PrismaService) {}

  async requestAccess(requesterId: string, studentId: string) {
    const student = await this.prisma.profile.findUnique({ where: { id: studentId } });
    if (!student) throw new NotFoundException('Student not found');
    
    if (!student.isOpenToRecruiters) {
      throw new ForbiddenException('Student is not open to recruiter requests');
    }

    const existing = await this.prisma.accessRequest.findUnique({
      where: { requesterId_studentId: { requesterId, studentId } }
    });
    if (existing) throw new BadRequestException('Request already exists');

    return this.prisma.accessRequest.create({
      data: {
        requesterId,
        studentId,
        status: 'PENDING'
      }
    });
  }

  async approveRequest(requestId: string) {
    return this.prisma.accessRequest.update({
      where: { id: requestId },
      data: { status: 'APPROVED' }
    });
  }

  async hasAccess(requesterId: string, studentId: string): Promise<boolean> {
    const request = await this.prisma.accessRequest.findUnique({
      where: { requesterId_studentId: { requesterId, studentId } }
    });
    return !!(request && request.status === 'APPROVED');
  }
  
  async findAllPending() {
    return this.prisma.accessRequest.findMany({
      where: { status: 'PENDING' },
      include: { requester: true, student: true }
    });
  }
}
