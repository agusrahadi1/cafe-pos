import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { User, UserRole, UserStatus } from '@prisma/client';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async create(createUserDto: CreateUserDto, companyId: string, outletId?: string): Promise<User> {
    // Quota Enforcement: check maxStaffAccounts on active subscription
    const company = await this.prisma.company.findUnique({
      where: { id: companyId },
      include: {
        subscriptions: {
          where: { status: 'ACTIVE' },
          orderBy: { createdAt: 'desc' },
          take: 1,
          include: { plan: true },
        },
      },
    });

    if (company?.subscriptions?.[0]?.plan) {
      const plan = company.subscriptions[0].plan;
      if (plan.maxStaffAccounts !== -1) {
        const currentStaffCount = await this.prisma.user.count({
          where: {
            companyId,
            role: { not: UserRole.SUPERADMIN },
            status: 'ACTIVE',
          },
        });
        if (currentStaffCount >= plan.maxStaffAccounts) {
          throw new BadRequestException(
            `Batas kuota akun staf untuk paket langganan (${plan.name}: maksimal ${plan.maxStaffAccounts} akun staf) telah tercapai. Silakan upgrade paket langganan Anda.`
          );
        }
      }
    }

    const existingUser = await this.prisma.user.findFirst({
      where: {
        email: createUserDto.email,
        companyId,
      },
    });

    if (existingUser) {
      throw new ConflictException('User with this email already exists in this company');
    }

    if (createUserDto.username) {
      const existingUsername = await this.prisma.user.findFirst({
        where: {
          username: createUserDto.username,
          companyId,
        },
      });
      if (existingUsername) {
        throw new ConflictException('User with this username already exists in this company');
      }
    }

    const { password, ...userData } = createUserDto;
    const passwordHash = await bcrypt.hash(password, 12);

    const user = await this.prisma.user.create({
      data: {
        ...userData,
        passwordHash,
        companyId,
        outletId,
        role: createUserDto.role || UserRole.CASHIER,
      },
    });

    const { passwordHash: _, refreshToken: __, ...userWithoutSecrets } = user;
    return userWithoutSecrets as any;
  }

  async findAll(companyId: string, outletId?: string): Promise<any[]> {
    return this.prisma.user.findMany({
      where: {
        companyId,
        ...(outletId && { outletId }),
      },
      select: {
        id: true,
        email: true,
        username: true,
        fullName: true,
        phone: true,
        role: true,
        status: true,
        lastLoginAt: true,
        createdAt: true,
        updatedAt: true,
        outletId: true,
        outlet: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findById(id: string): Promise<any | null> {
    return this.prisma.user.findUnique({
      where: { id },
      include: {
        company: true,
        outlet: {
          select: { id: true, name: true },
        },
      },
    });
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.prisma.user.findFirst({
      where: { email },
    });
  }

  async findByEmailOrUsername(identifier: string): Promise<User | null> {
    return this.prisma.user.findFirst({
      where: {
        OR: [
          { email: identifier },
          { username: identifier },
        ],
      },
      include: {
        company: true,
      },
    });
  }

  async findByEmailAndCompany(email: string, companyId: string): Promise<User | null> {
    return this.prisma.user.findFirst({
      where: { email, companyId },
    });
  }

  async update(id: string, updateUserDto: UpdateUserDto): Promise<any> {
    const user = await this.findById(id);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (updateUserDto.email && updateUserDto.email !== user.email) {
      const existingUser = await this.prisma.user.findFirst({
        where: {
          email: updateUserDto.email,
          companyId: user.companyId,
          NOT: { id },
        },
      });

      if (existingUser) {
        throw new ConflictException('Email already in use');
      }
    }

    if (updateUserDto.username && updateUserDto.username !== user.username) {
      const existingUsername = await this.prisma.user.findFirst({
        where: {
          username: updateUserDto.username,
          companyId: user.companyId,
          NOT: { id },
        },
      });

      if (existingUsername) {
        throw new ConflictException('Username already in use');
      }
    }

    const data: any = { ...updateUserDto };
    if (updateUserDto.password) {
      data.passwordHash = await bcrypt.hash(updateUserDto.password, 12);
      delete data.password;
    }

    const updated = await this.prisma.user.update({
      where: { id },
      data,
    });

    const { passwordHash: _, refreshToken: __, ...userWithoutSecrets } = updated;
    return userWithoutSecrets;
  }

  async resetPassword(id: string, newPassword: string): Promise<{ message: string }> {
    const user = await this.findById(id);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const passwordHash = await bcrypt.hash(newPassword, 12);
    await this.prisma.user.update({
      where: { id },
      data: {
        passwordHash,
        refreshToken: null,
      },
    });

    return { message: 'Password berhasil direset' };
  }

  async remove(id: string): Promise<User> {
    const user = await this.findById(id);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    return this.prisma.user.delete({
      where: { id },
    });
  }

  async updateStatus(id: string, status: UserStatus): Promise<User> {
    const user = await this.findById(id);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    return this.prisma.user.update({
      where: { id },
      data: { status },
    });
  }

  async updateRefreshToken(id: string, refreshToken: string | null): Promise<User> {
    return this.prisma.user.update({
      where: { id },
      data: { refreshToken },
    });
  }
}