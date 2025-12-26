import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class EventService {
  constructor(private prisma: PrismaService) {}

  async create(data: any) {
    return this.prisma.event.create({ data });
  }

  async addParticipant(eventId: string, data: { studentId: string, position?: string, award?: string, score?: number }) {
    const event = await this.prisma.event.findUnique({ where: { id: eventId } });
    if (!event) throw new NotFoundException('Event not found');

    return this.prisma.eventParticipation.create({
      data: {
        eventId,
        profileId: data.studentId,
        position: data.position,
        award: data.award,
        score: data.score
      }
    });
  }

  async findAll() {
    return this.prisma.event.findMany({
      where: { isRecognized: true }, // List recognized/public events?
      orderBy: { date: 'desc' }
    });
  }

  async findResults(eventId: string) {
    const event = await this.prisma.event.findUnique({ where: { id: eventId } });
    if (!event) throw new NotFoundException('Event not found');

    return this.prisma.eventParticipation.findMany({
      where: { eventId },
      include: { 
        profile: { select: { fullName: true, avatar: true, nin: true } } 
      },
      orderBy: { score: 'desc' } // or position logic
    });
  }
}
