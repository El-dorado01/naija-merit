import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  Request,
  ForbiddenException,
  Patch,
  Delete,
  Query,
} from '@nestjs/common';
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
  create(
    @Body()
    dto: {
      name: string;
      type: string;
      address?: string;
      state?: string;
    },
  ) {
    // Ideally protected by Admin Guard
    return this.institutionService.create(dto);
  }

  @Get()
  findAll(@Query('type') type?: string) {
    return this.institutionService.findAll(type);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.institutionService.findOne(id);
  }

  @Get(':id/students')
  @UseGuards(JwtAuthGuard)
  async getStudents(
    @Request() req,
    @Param('id') id: string,
    @Query('page') page?: number,
    @Query('search') search?: string,
  ) {
    // Check access: only admin or the institution itself
    if (req.user.role !== 'admin' && req.user.institutionId !== id) {
      throw new ForbiddenException('Access denied');
    }

    return this.institutionService.getStudents(id, page || 1, search);
  }

  @UseGuards(JwtAuthGuard)
  @Post(':id/students')
  async registerStudents(
    @Request() req,
    @Param('id') id: string,
    @Body() students: any[],
  ) {
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

  @Patch(':id')
  @UseGuards(JwtAuthGuard, PermissionGuard)
  @RequirePermission('manage_institutions')
  update(
    @Param('id') id: string,
    @Body()
    dto: { name?: string; type?: string; address?: string; state?: string },
  ) {
    return this.institutionService.update(id, dto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, PermissionGuard)
  @RequirePermission('manage_institutions')
  delete(@Param('id') id: string) {
    return this.institutionService.delete(id);
  }

  @Patch(':id/settings')
  @UseGuards(JwtAuthGuard)
  async updateSettings(
    @Request() req,
    @Param('id') id: string,
    @Body() dto: { cgpaScale?: number },
  ) {
    // Only school_admin of the institution or admin can update settings
    if (req.user.role !== 'admin' && req.user.institutionId !== id) {
      throw new ForbiddenException('Access denied');
    }
    return this.institutionService.updateSettings(id, dto);
  }
}
