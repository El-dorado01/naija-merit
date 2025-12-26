import { Controller, Post, Patch, Get, Param, UseGuards, Request, ForbiddenException } from '@nestjs/common';
import { AccessRequestService } from './access-request.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('access')
@UseGuards(JwtAuthGuard)
export class AccessRequestController {
  constructor(private readonly accessService: AccessRequestService) {}

  @Post('request/:studentId')
  requestAccess(@Request() req, @Param('studentId') studentId: string) {
    if (req.user.role !== 'recruiter') throw new ForbiddenException('Only recruiters can request access');
    return this.accessService.requestAccess(req.user.userId, studentId);
  }

  @Patch('approve/:id')
  approveRequest(@Request() req, @Param('id') id: string) {
    if (req.user.role !== 'admin' && req.user.role !== 'school_admin') throw new ForbiddenException('Only admins can approve requests');
    return this.accessService.approveRequest(id);
  }

  @Get('pending')
  getPending(@Request() req) {
    if (req.user.role !== 'admin' && req.user.role !== 'school_admin') throw new ForbiddenException('Only admins can view pending requests');
    return this.accessService.findAllPending();
  }
}
