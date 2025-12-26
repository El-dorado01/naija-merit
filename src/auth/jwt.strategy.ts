import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuthService } from './auth.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private prisma: PrismaService,
    private authService: AuthService
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: 'SECRET_KEY',
      passReqToCallback: true, // Allow accessing request to get token
    });
  }

  async validate(req: any, payload: any) {
    const token = ExtractJwt.fromAuthHeaderAsBearerToken()(req);
    if (token && await this.authService.isTokenBlacklisted(token)) {
      throw new UnauthorizedException('Token has been revoked');
    }

    const user = await this.prisma.profile.findUnique({ where: { id: payload.sub } });
    if (!user) return null;
    return { 
      userId: payload.sub, 
      email: payload.email, 
      role: payload.role,
      isVerified: user.isVerified 
    };
  }
}
