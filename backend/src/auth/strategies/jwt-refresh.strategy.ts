import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { UsersService } from '../../users/users.service';

@Injectable()
export class JwtRefreshStrategy extends PassportStrategy(Strategy, 'jwt-refresh') {
  constructor(
    private configService: ConfigService,
    private usersService: UsersService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_REFRESH_SECRET') || 'default-jwt-refresh-secret-key-cafe-pos-2026',
      passReqToCallback: true,
    });
  }

  async validate(req: any, payload: any) {
    const refreshToken = req.headers.authorization?.replace('Bearer ', '');
    const user = await this.usersService.findById(payload.sub);

    if (!user || user.refreshToken !== refreshToken) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    if (user.status !== 'ACTIVE') {
      throw new UnauthorizedException('User not found or inactive');
    }

    return {
      sub: user.id,
      email: user.email,
      role: user.role,
      companyId: user.companyId,
      outletId: user.outletId,
      fullName: user.fullName,
    };
  }
}