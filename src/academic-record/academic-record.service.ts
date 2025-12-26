import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AcademicRecordService {
  constructor(private prisma: PrismaService) {}

  async create(data: any) {
    // Basic validation: ensure profile and institution exist?
    // For now trust constraints or add checks
    return this.prisma.academicRecord.create({ data });
  }

  async findAllByStudent(profileId: string) {
    return this.prisma.academicRecord.findMany({
      where: { profileId },
      include: { institution: true }
    });
  }

  async findOne(id: string) {
    const record = await this.prisma.academicRecord.findUnique({
      where: { id },
      include: { institution: true, profile: true }
    });
    if (!record) throw new NotFoundException('Academic record not found');
    return record;
  }

  async update(id: string, data: any) {
    await this.findOne(id);
    return this.prisma.academicRecord.update({
      where: { id },
      data,
    });
  }

  async verify(id: string, verifierId: string) {
    await this.findOne(id);
    return this.prisma.academicRecord.update({
      where: { id },
      data: { isVerified: true, verifiedBy: verifierId }
    });
  }
}
