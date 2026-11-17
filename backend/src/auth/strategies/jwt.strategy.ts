import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { UsersService } from '../../users/users.service';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(
    private configService: ConfigService,
    private usersService: UsersService,
    private prisma: PrismaService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_SECRET') || 'default-jwt-secret-key-cafe-pos-2026',
    });
  }

  async validate(payload: any) {
    const user = await this.usersService.findById(payload.sub);
    if (!user || user.status !== 'ACTIVE') {
      throw new UnauthorizedException('User not found or inactive');
    }

    if (user.role !== 'SUPERADMIN' && user.company) {
      if (user.company.status !== 'ACTIVE') {
        throw new UnauthorizedException(
          user.company.status === 'SUSPENDED'
            ? 'Akses kafe Anda saat ini ditangguhkan (SUSPENDED). Silakan hubungi Superadmin.'
            : 'Masa langganan kafe Anda telah kedaluwarsa. Silakan hubungi Superadmin.'
        );
      }
    }

    let outletId = user.outletId;
    if (!outletId && user.companyId) {
      const defaultOutlet = await this.prisma.outlet.findFirst({
        where: { companyId: user.companyId, isActive: true },
        orderBy: { createdAt: 'asc' },
      });
      if (defaultOutlet) {
        outletId = defaultOutlet.id;
      }
    }

    return {
      id: user.id,
      sub: user.id,
      email: user.email,
      role: user.role,
      companyId: user.companyId,
      outletId: outletId || null,
      fullName: user.fullName,
      company: user.company
        ? {
            id: user.company.id,
            name: user.company.name,
            slug: user.company.slug,
            tagline: user.company.tagline,
            address: user.company.address,
            phone: user.company.phone,
            logo: user.company.logo,
            logoUrl: user.company.logoUrl,
            receiptFooter: user.company.receiptFooter,
          }
        : null,
    };
  }
}