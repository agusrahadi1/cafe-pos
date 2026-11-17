import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { UsersService } from '../users/users.service';
import { AuditLogsService } from '../audit-logs/audit-logs.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { User, UserRole, UserStatus } from '@prisma/client';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private usersService: UsersService,
    private auditLogsService: AuditLogsService,
  ) {}

  async validateUser(emailOrUsername: string, password: string): Promise<User | null> {
    const user = await this.usersService.findByEmailOrUsername(emailOrUsername);
    if (!user) {
      return null;
    }

    if (user.status !== UserStatus.ACTIVE) {
      throw new UnauthorizedException('Account is not active');
    }

    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) {
      return null;
    }

    return user;
  }

  async login(loginDto: LoginDto, ipAddress?: string, userAgent?: string) {
    const user = await this.validateUser(loginDto.email, loginDto.password);
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (user.companyId && !user.outletId) {
      let outlet = await this.prisma.outlet.findFirst({
        where: { companyId: user.companyId, isActive: true },
        orderBy: { createdAt: 'asc' },
      });
      if (!outlet) {
        outlet = await this.prisma.outlet.create({
          data: {
            companyId: user.companyId,
            name: `${user.fullName}'s Cafe - Pusat`,
            code: 'MAIN',
          },
        });
      }
      user.outletId = outlet.id;
      await this.prisma.user.update({
        where: { id: user.id },
        data: { outletId: outlet.id },
      });
    }

    const tokens = await this.generateTokens(user);

    // Update last login and refresh token
    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        lastLoginAt: new Date(),
        refreshToken: tokens.refreshToken,
      },
    });

    // Audit log
    await this.auditLogsService.log({
      companyId: user.companyId || undefined,
      outletId: user.outletId || undefined,
      userId: user.id,
      action: 'LOGIN',
      entity: 'User',
      entityId: user.id,
      ipAddress,
      userAgent,
    });

    const { passwordHash, refreshToken: _, ...userWithoutSecrets } = user;
    return {
      user: userWithoutSecrets,
      ...tokens,
    };
  }

  async register(registerDto: RegisterDto, ipAddress?: string, userAgent?: string) {
    const existingUser = await this.usersService.findByEmail(registerDto.email);
    if (existingUser) {
      throw new ConflictException('Email already registered');
    }

    const passwordHash = await bcrypt.hash(registerDto.password, 12);

    const companyName = registerDto.companyName || `${registerDto.fullName}'s Company`;
    const baseSlug = companyName.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '') || 'cafe';
    const slug = `${baseSlug}-${Date.now().toString(36)}`;

    const company = await this.prisma.company.create({
      data: {
        name: companyName,
        slug,
      },
    });

    const defaultOutlet = await this.prisma.outlet.create({
      data: {
        companyId: company.id,
        name: `${companyName} - Pusat`,
        code: 'MAIN',
        phone: registerDto.phone,
        email: registerDto.email,
        taxRate: 0,
        serviceCharge: 0,
      },
    });

    const user = await this.prisma.user.create({
      data: {
        email: registerDto.email,
        passwordHash,
        fullName: registerDto.fullName,
        phone: registerDto.phone,
        role: UserRole.ADMIN,
        companyId: company.id,
        outletId: defaultOutlet.id,
      },
    });

    const tokens = await this.generateTokens(user);

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        refreshToken: tokens.refreshToken,
      },
    });

    await this.auditLogsService.log({
      companyId: user.companyId || undefined,
      userId: user.id,
      action: 'REGISTER',
      entity: 'User',
      entityId: user.id,
      ipAddress,
      userAgent,
    });

    const { passwordHash: _, refreshToken: __, ...userWithoutSecrets } = user;
    return {
      user: userWithoutSecrets,
      ...tokens,
    };
  }

  async refreshTokens(refreshTokenDto: RefreshTokenDto, ipAddress?: string, userAgent?: string) {
    const { refreshToken } = refreshTokenDto;

    try {
      const payload = this.jwtService.verify(refreshToken, {
        secret: process.env.JWT_REFRESH_SECRET,
      });

      const user = await this.usersService.findById(payload.sub);
      if (!user || user.refreshToken !== refreshToken) {
        throw new UnauthorizedException('Invalid refresh token');
      }

      if (user.status !== UserStatus.ACTIVE) {
        throw new UnauthorizedException('Account is not active');
      }

      const tokens = await this.generateTokens(user);

      await this.prisma.user.update({
        where: { id: user.id },
        data: {
          refreshToken: tokens.refreshToken,
        },
      });

      await this.auditLogsService.log({
        companyId: user.companyId,
        outletId: user.outletId || undefined,
        userId: user.id,
        action: 'TOKEN_REFRESH',
        entity: 'User',
        entityId: user.id,
        ipAddress,
        userAgent,
      });

      return tokens;
    } catch (error) {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  async logout(userId: string, ipAddress?: string, userAgent?: string) {
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        refreshToken: null,
      },
    });

    const user = await this.usersService.findById(userId);
    if (user) {
      await this.auditLogsService.log({
        companyId: user.companyId || undefined,
        outletId: user.outletId || undefined,
        userId,
        action: 'LOGOUT',
        entity: 'User',
        entityId: userId,
        ipAddress,
        userAgent,
      });
    }

    return { message: 'Logged out successfully' };
  }

  async changePassword(userId: string, oldPassword: string, newPassword: string, ipAddress?: string, userAgent?: string) {
    const user = await this.usersService.findById(userId);
    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    const isPasswordValid = await bcrypt.compare(oldPassword, user.passwordHash);
    if (!isPasswordValid) {
      throw new BadRequestException('Current password is incorrect');
    }

    const passwordHash = await bcrypt.hash(newPassword, 12);
    await this.prisma.user.update({
      where: { id: userId },
      data: { passwordHash },
    });

    await this.auditLogsService.log({
      companyId: user.companyId || undefined,
      outletId: user.outletId || undefined,
      userId,
      action: 'PASSWORD_CHANGE',
      entity: 'User',
      entityId: userId,
      ipAddress,
      userAgent,
    });

    return { message: 'Password changed successfully' };
  }

  private async generateTokens(user: User) {
    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      companyId: user.companyId,
      outletId: user.outletId,
    };

    const accessToken = this.jwtService.sign(payload);
    const refreshToken = this.jwtService.sign(payload, {
      secret: process.env.JWT_REFRESH_SECRET,
      expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
    });

    return { accessToken, refreshToken };
  }
}