import { Controller, Post, Get, Body, Param, UseGuards, Request, ForbiddenException } from '@nestjs/common';
import { EventService } from './event.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('events')
export class EventController {
  constructor(private readonly eventService: EventService) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  create(@Request() req, @Body() dto: any) {
    if (req.user.role !== 'event-organizer' && req.user.role !== 'admin') {
      throw new ForbiddenException('Only event organizers can create events');
    }
    // Auto-verify check
    if (req.user.role === 'event-organizer' && !req.user.isVerified) {
       throw new ForbiddenException('Organizer account must be verified to create events');
    }

    return this.eventService.create(dto);
  }

  @UseGuards(JwtAuthGuard)
  @Post(':id/participants')
  addParticipant(@Request() req, @Param('id') eventId: string, @Body() dto: { studentId: string, position?: string, award?: string, score?: number }) {
    if (req.user.role !== 'event-organizer' && req.user.role !== 'admin') {
      throw new ForbiddenException('Only organizers can add participants');
    }
    return this.eventService.addParticipant(eventId, dto);
  }

  @Get()
  findAll() {
    return this.eventService.findAll();
  }

  @Get(':id/results')
  getResults(@Param('id') eventId: string) {
    return this.eventService.findResults(eventId);
  }
}
