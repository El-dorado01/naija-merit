import { Controller, Post, Get, Patch, Delete, Body, Param, UseGuards, Request } from '@nestjs/common';
import { AdminService } from './admin.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('admin')
@UseGuards(JwtAuthGuard)
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Post('create-admin')
  createAdmin(@Request() req, @Body() dto: { email: string; fullName: string; password: string; permissions: string[] }) {
    return this.adminService.createAdmin(req.user.userId, dto);
  }

  @Get('admins')
  listAdmins(@Request() req) {
    return this.adminService.listAdmins(req.user.userId);
  }

  @Patch('admins/:id/permissions')
  updatePermissions(@Request() req, @Param('id') adminId: string, @Body() dto: { permissions: string[] }) {
    return this.adminService.updatePermissions(req.user.userId, adminId, dto.permissions);
  }

  @Delete('admins/:id')
  deleteAdmin(@Request() req, @Param('id') adminId: string) {
    return this.adminService.deleteAdmin(req.user.userId, adminId);
  }

  @Post('approve-role/:userId')
  approveRole(@Request() req, @Param('userId') userId: string, @Body() dto: { role: string }) {
    return this.adminService.approveRole(req.user.userId, userId, dto.role);
  }

  @Get('users')
  getAllUsers(@Request() req, @Body() filters?: { role?: string; isVerified?: boolean }) {
    return this.adminService.getAllUsers(req.user.userId, filters);
  }

  @Post('recognize-event/:eventId')
  recognizeEvent(@Request() req, @Param('eventId') eventId: string) {
    return this.adminService.recognizeEvent(req.user.userId, eventId);
  }
}
