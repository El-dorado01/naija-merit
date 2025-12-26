import { Controller, Get, Post, Body, Param, Patch, UseGuards, Request, ForbiddenException } from '@nestjs/common';
import { AcademicRecordService } from './academic-record.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AccessRequestService } from '../access-request/access-request.service';

@Controller('academics') // Renamed
@UseGuards(JwtAuthGuard)
export class AcademicRecordController {
  constructor(
    private readonly academicRecordService: AcademicRecordService,
    private readonly accessService: AccessRequestService
  ) {}

  @Post()
  create(@Request() req, @Body() dto: any) {
    // Only school_admin or admin can upload
    if (!['school_admin', 'admin', 'teacher'].includes(req.user.role)) {
      throw new ForbiddenException('Only school staff can upload records');
    }
    return this.academicRecordService.create(dto);
  }

  @Get('my')
  getMyAcademics(@Request() req) {
    return this.academicRecordService.findAllByStudent(req.user.userId);
  }

  @Get(':studentId')
  async getStudentAcademics(@Request() req, @Param('studentId') studentId: string) {
    const { userId, role } = req.user;
    
    // Authorization Check
    const isSelf = userId === studentId;
    const isAdmin = ['admin', 'school_admin'].includes(role);
    let hasAccess = isSelf || isAdmin;

    if (!hasAccess && role === 'recruiter') {
      hasAccess = await this.accessService.hasAccess(userId, studentId);
    }

    if (!hasAccess) throw new ForbiddenException('Access denied to academic records');

    return this.academicRecordService.findAllByStudent(studentId);
  }

  @Patch(':id')
  update(@Request() req, @Param('id') id: string, @Body() dto: any) {
    if (!['school_admin', 'admin'].includes(req.user.role)) {
      throw new ForbiddenException('Only admins can update records');
    }
    return this.academicRecordService.update(id, dto);
  }

  @Post('verify/:id')
  verify(@Request() req, @Param('id') id: string) {
    if (!['school_admin', 'admin'].includes(req.user.role)) {
      throw new ForbiddenException('Only admins can verify records');
    }
    return this.academicRecordService.verify(id, req.user.userId);
  }
}
