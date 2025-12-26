import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ExtracurricularService {
  constructor(private prisma: PrismaService) {}

  async create(data: any) {
    // Validate profile existence if strictly needed, or trust DB FK
    return this.prisma.extracurricularActivity.create({ data });
  }

  async findAllByStudent(profileId: string) {
    return this.prisma.extracurricularActivity.findMany({
      where: { profileId },
      orderBy: { date: 'desc' }
    });
  }

  async findOne(id: string) {
    const activity = await this.prisma.extracurricularActivity.findUnique({
      where: { id }
    });
    if (!activity) throw new NotFoundException('Activity not found');
    return activity;
  }

  async update(id: string, data: any) {
    await this.findOne(id);
    return this.prisma.extracurricularActivity.update({
      where: { id },
      data
    });
  }

  async verify(id: string) {
    await this.findOne(id);
    return this.prisma.extracurricularActivity.update({
      where: { id },
      data: { isVerified: true }
    });
  }
}
