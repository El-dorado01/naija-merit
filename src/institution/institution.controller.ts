import { Controller, Get, Post, Body, Param, UseGuards, Request, ForbiddenException } from '@nestjs/common';
import { InstitutionService } from './institution.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PermissionGuard } from '../guards/permission.guard';
import { RequirePermission } from '../decorators/permissions.decorator';

@Controller('institution')
export class InstitutionController {
  constructor(private readonly institutionService: InstitutionService) {}

  @Post()
  @UseGuards(JwtAuthGuard, PermissionGuard)
  @RequirePermission('manage_institutions')
  create(@Body() dto: { name: string; type: string; address?: string; state?: string }) {
    // Ideally protected by Admin Guard
    return this.institutionService.create(dto);
  }

  @Get()
  findAll() {
    return this.institutionService.findAll();
  }

  @UseGuards(JwtAuthGuard)
  @Post(':id/students')
  async registerStudents(@Request() req, @Param('id') id: string, @Body() students: any[]) {
     if (req.user.role !== 'school_admin' && req.user.role !== 'admin') {
        throw new ForbiddenException('Only school admins can register students');
     }
     // Optionally check if req.user.institutionId === id
     return this.institutionService.registerStudents(id, students);
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id/analytics')
  async getAnalytics(@Request() req, @Param('id') id: string) {
     if (req.user.role !== 'school_admin' && req.user.role !== 'admin') {
        throw new ForbiddenException('Access denied');
     }
     return this.institutionService.getAnalytics(id);
  }
}
