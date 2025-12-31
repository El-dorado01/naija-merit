import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { MailService } from '../mail/mail.service';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class AuthService {
  // Trigger restart for Prisma client update
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private mailService: MailService,
  ) {}

  async register(data: {
    email: string;
    password?: string;
    role: string;
    fullName?: string;
  }) {
    // Check if user exists
    const existing = await this.prisma.profile.findUnique({
      where: { email: data.email },
    });
    if (existing) throw new ConflictException('Email already registered');

    const hashedPassword = data.password
      ? await bcrypt.hash(data.password, 10)
      : undefined;

    const user = await this.prisma.profile.create({
      data: {
        email: data.email,
        password: hashedPassword,
        role: data.role,
        fullName: data.fullName,
        isVerified: false,
      },
    });

    const payload = {
      sub: user.id,
      email: user.email ?? '',
      role: user.role ?? 'student',
    };

    // Send Verification Link
    if (user.email) {
      await this.generateAndSendVerificationLink(user.email);
    }

    return {
      message: 'Registration successful. Verification link sent to email.',
      access_token: this.jwtService.sign(payload, { expiresIn: '15m' } as any),
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        fullName: user.fullName,
      },
    };
  }

  async login(data: { email: string; password: string }) {
    const user = await this.prisma.profile.findUnique({
      where: { email: data.email },
    });
    if (!user) throw new UnauthorizedException('Invalid credentials');

    if (user.password && data.password) {
      const isMatch = await bcrypt.compare(data.password, user.password);
      if (!isMatch) throw new UnauthorizedException('Invalid credentials');
    } else if (user.password && !data.password) {
      throw new UnauthorizedException('Password required');
    }

    const payload = {
      sub: user.id,
      email: user.email ?? '',
      role: user.role ?? 'student',
    };
    return {
      access_token: this.jwtService.sign(payload, { expiresIn: '30d' } as any),
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        fullName: user.fullName,
      },
    };
  }

  async verifyNin(userId: string, nin: string) {
    // 1. Lookup NIN in database
    const ninData = await this.prisma.nin.findUnique({ where: { nin } });
    if (!ninData) {
      throw new BadRequestException('NIN not found in national database');
    }

    // 2. Check if NIN is already used
    const existingProfile = await this.prisma.profile.findUnique({
      where: { nin },
    });

    // Use transaction to ensure atomicity
    return await this.prisma.$transaction(async (tx) => {
      if (existingProfile) {
        if (existingProfile.id === userId) {
          return { message: 'NIN already verified for this account' };
        }

        // Check if "Claimable" (Skeletal profile from school)
        // If it has a password, it's a real account. Conflict.
        if (existingProfile.password) {
          throw new ConflictException(
            'NIN already linked to another active account',
          );
        }

        // === CLAIMING PROCESS ===
        // Migrate data from skeletal profile to current user

        // 1. Academic Records
        await tx.academicRecord.updateMany({
          where: { profileId: existingProfile.id },
          data: { profileId: userId },
        });

        // 2. Extracurriculars
        await tx.extracurricularActivity.updateMany({
          where: { profileId: existingProfile.id },
          data: { profileId: userId },
        });

        // 3. Event Participations
        await tx.eventParticipation.updateMany({
          where: { profileId: existingProfile.id },
          data: { profileId: userId },
        });

        // 4. Update Current User School if missing
        // If user hasn't selected a school yet, use the one from the skeletal profile
        if (existingProfile.institutionId) {
          const currentUser = await tx.profile.findUnique({
            where: { id: userId },
          });
          if (!currentUser?.institutionId) {
            await tx.profile.update({
              where: { id: userId },
              data: { institutionId: existingProfile.institutionId },
            });
          }
        }

        // 5. Delete the skeletal profile to prevent duplicates
        await tx.profile.delete({ where: { id: existingProfile.id } });
      }

      // 3. Update current user with NIN and verified data from mock lookup
      return tx.profile.update({
        where: { id: userId },
        data: {
          nin,
          isVerified: true,
          // Auto-fill details from NIN record
          fullName: ninData.fullName,
          dateOfBirth: ninData.dateOfBirth,
          gender: ninData.gender,
          stateOfOrigin: ninData.stateOfOrigin,
          phoneNumber: ninData.phoneNumber || undefined,
          email: ninData.email || undefined,
        },
      });
    });
  }

  async forgotPassword(email: string) {
    const user = await this.prisma.profile.findUnique({ where: { email } });
    if (!user) throw new NotFoundException('User not found');

    // Generate token (simple random string for MVP)
    const token =
      Math.random().toString(36).substring(2, 15) +
      Math.random().toString(36).substring(2, 15);
    const expiresAt = new Date(Date.now() + 1000 * 60 * 60); // 1 hour

    await this.prisma.passwordResetToken.create({
      data: {
        email,
        token,
        expiresAt,
      },
    });

    // Mock Email Service
    console.log(`[Email Service] Password Reset Token for ${email}: ${token}`);

    return { message: 'Password reset email sent' };
  }

  async resetPassword(token: string, newPassword: string) {
    const resetToken = await this.prisma.passwordResetToken.findUnique({
      where: { token },
    });
    if (!resetToken) throw new NotFoundException('Invalid or expired token');

    if (resetToken.expiresAt < new Date()) {
      await this.prisma.passwordResetToken.delete({ where: { token } });
      throw new UnauthorizedException('Token expired');
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    const user = await this.prisma.profile.findUnique({
      where: { email: resetToken.email },
    });

    // ideally use transaction
    await this.prisma.profile.update({
      where: { id: user?.id },
      data: { password: hashedPassword },
    });
    await this.prisma.passwordResetToken.delete({ where: { token } });

    return { message: 'Password successfully reset' };
  }

  async logout(token: string) {
    // Decode token to get expiration
    const decoded: any = this.jwtService.decode(token);
    const expiresAt =
      decoded && decoded.exp
        ? new Date(decoded.exp * 1000)
        : new Date(Date.now() + 1000 * 60 * 60 * 24);

    await this.prisma.tokenBlacklist.create({
      data: {
        token,
        expiresAt,
      },
    });
    return { message: 'Logged out successfully' };
  }

  async isTokenBlacklisted(token: string): Promise<boolean> {
    const blacklisted = await this.prisma.tokenBlacklist.findUnique({
      where: { token },
    });
    return !!blacklisted;
  }

  async generateAndSendOtp(email: string) {
    // Check if user exists (optional, but good for security)
    const user = await this.prisma.profile.findUnique({ where: { email } });
    if (!user) throw new NotFoundException('User not found');

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Store in DB
    await this.prisma.otp.create({
      data: {
        email,
        code: otp,
        expiresAt,
      },
    });

    // Send email
    const sent = await this.mailService.sendOtpEmail(email, otp);
    if (!sent)
      throw new BadRequestException('Failed to send verification email');

    return { message: 'Verification code sent to email' };
  }

  async verifyOtp(email: string, code: string, oldToken?: string) {
    const otpRecord = await this.prisma.otp.findFirst({
      where: {
        email,
        code,
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!otpRecord) {
      throw new BadRequestException('Invalid or expired verification code');
    }

    // Blacklist old token if provided
    if (oldToken) {
      try {
        await this.logout(oldToken);
      } catch (e) {
        // Ignore errors if token is already expired or malformed
      }
    }

    // Mark user as verified
    const user = await this.prisma.profile.update({
      where: { email },
      data: { isVerified: true },
    });

    // Delete OTP record (cleanup)
    await this.prisma.otp.deleteMany({ where: { email } });

    // Issue new long-lived token
    const payload = { sub: user.id, email: user.email, role: user.role };
    return {
      message: 'Email verified successfully',
      access_token: this.jwtService.sign(payload, { expiresIn: '30d' }),
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        fullName: user.fullName,
      },
    };
  }

  async generateAndSendVerificationLink(email: string) {
    const user = await this.prisma.profile.findUnique({ where: { email } });
    if (!user) throw new NotFoundException('User not found');

    const token = uuidv4();
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    await this.prisma.verificationToken.create({
      data: {
        email,
        token,
        expiresAt,
      },
    });

    const sent = await this.mailService.sendVerificationEmail(email, token);
    if (!sent)
      throw new BadRequestException('Failed to send verification email');

    return { message: 'Verification link sent to email' };
  }

  async verifyEmail(token: string) {
    const verificationRecord = await this.prisma.verificationToken.findUnique({
      where: { token },
    });

    if (!verificationRecord || verificationRecord.expiresAt < new Date()) {
      if (verificationRecord) {
        await this.prisma.verificationToken.delete({ where: { token } });
      }
      throw new BadRequestException('Invalid or expired verification link');
    }

    const { email } = verificationRecord;

    // Mark user as verified
    const user = await this.prisma.profile.update({
      where: { email },
      data: { isVerified: true },
    });

    // Clean up
    await this.prisma.verificationToken.delete({ where: { token } });

    // Issue new long-lived token
    const payload = { sub: user.id, email: user.email, role: user.role };
    return {
      message: 'Email verified successfully',
      access_token: this.jwtService.sign(payload, { expiresIn: '30d' }),
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        fullName: user.fullName,
      },
    };
  }
}
