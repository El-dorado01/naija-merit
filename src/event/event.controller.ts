import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  UseGuards,
  Request,
  ForbiddenException,
  Patch,
  Delete,
} from '@nestjs/common';
import { EventService } from './event.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PermissionGuard } from '../guards/permission.guard';
import { RequirePermission } from '../decorators/permissions.decorator';

@Controller('events')
export class EventController {
  constructor(private readonly eventService: EventService) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  create(@Request() req, @Body() dto: any) {
    if (
      req.user.role !== 'event-organizer' &&
      req.user.role !== 'admin' &&
      req.user.role !== 'company'
    ) {
      throw new ForbiddenException(
        'Only event organizers and branded companies can create events',
      );
    }
    // Admin verification check (different from email verification)
    if (
      (req.user.role === 'event-organizer' || req.user.role === 'company') &&
      !req.user.isAdminVerified
    ) {
      throw new ForbiddenException(
        'Your account must be approved by an administrator to create events',
      );
    }

    return this.eventService.create(dto);
  }

  @UseGuards(JwtAuthGuard)
  @Post(':id/participants')
  addParticipant(
    @Request() req,
    @Param('id') eventId: string,
    @Body()
    dto: {
      studentId: string;
      position?: string;
      award?: string;
      score?: number;
    },
  ) {
    if (
      req.user.role !== 'event-organizer' &&
      req.user.role !== 'admin' &&
      req.user.role !== 'company'
    ) {
      throw new ForbiddenException('Only organizers can add participants');
    }
    return this.eventService.addParticipant(eventId, dto);
  }

  @Get()
  async findAll(@Request() req) {
    // Optional check: if authorized and admin, show all.
    // This requires optional auth which might be tricky with standard JwtAuthGuard.
    // For now, let's keep it simple or add a dedicated admin fetch.
    return this.eventService.findAll();
  }

  @UseGuards(JwtAuthGuard, PermissionGuard)
  @RequirePermission('manage_events')
  @Get('admin/all')
  findAllForAdmin() {
    return this.eventService.findAll(true);
  }

  @Get(':id/results')
  getResults(@Param('id') eventId: string) {
    return this.eventService.findResults(eventId);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, PermissionGuard)
  @RequirePermission('manage_events')
  update(@Param('id') id: string, @Body() dto: any) {
    return this.eventService.update(id, dto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, PermissionGuard)
  @RequirePermission('manage_events')
  delete(@Param('id') id: string) {
    return this.eventService.delete(id);
  }
}
