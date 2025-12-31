import {
  Controller,
  Post,
  Get,
  Body,
  UseGuards,
  Request,
  Headers,
  Query,
  Delete,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './jwt-auth.guard';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  register(
    @Body()
    dto: {
      email: string;
      password?: string;
      role: string;
      fullName?: string;
    },
  ) {
    return this.authService.register(dto);
  }

  @Post('login')
  login(@Body() dto: { email: string; password: string }) {
    return this.authService.login(dto);
  }

  @Post('verify-nin')
  @UseGuards(JwtAuthGuard)
  verifyNin(@Request() req, @Body() dto: { nin: string }) {
    return this.authService.verifyNin(req.user.userId, dto.nin);
  }

  @Post('forgot-password')
  forgotPassword(@Body() dto: { email: string }) {
    return this.authService.forgotPassword(dto.email);
  }

  @Post('reset-password')
  resetPassword(@Body() dto: { token: string; newPassword: string }) {
    return this.authService.resetPassword(dto.token, dto.newPassword);
  }

  @Delete('logout')
  logout(@Headers('authorization') authHeader: string) {
    if (!authHeader) return { message: 'Already logged out' };
    const token = authHeader.split(' ')[1];
    return this.authService.logout(token);
  }

  @Post('send-otp')
  sendOtp(@Body('email') email: string) {
    return this.authService.generateAndSendOtp(email);
  }

  @Post('verify-otp')
  verifyOtp(
    @Body('email') email: string,
    @Body('code') code: string,
    @Headers('authorization') authHeader?: string,
  ) {
    const token = authHeader?.split(' ')[1];
    return this.authService.verifyOtp(email, code, token);
  }

  @Get('verify-email')
  verifyEmail(@Query('token') token: string) {
    return this.authService.verifyEmail(token);
  }
}
