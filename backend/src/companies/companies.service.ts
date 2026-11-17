import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCompanyDto } from './dto/create-company.dto';
import { UpdateCompanyDto } from './dto/update-company.dto';
import { Company } from '@prisma/client';

@Injectable()
export class CompaniesService {
  constructor(private prisma: PrismaService) {}

  async create(createCompanyDto: CreateCompanyDto): Promise<Company> {
    const existingCompany = await this.prisma.company.findUnique({
      where: { slug: createCompanyDto.slug },
    });

    if (existingCompany) {
      throw new ConflictException('Company slug already exists');
    }

    return this.prisma.company.create({
      data: createCompanyDto,
    });
  }

  async findAll(): Promise<Company[]> {
    return this.prisma.company.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: { outlets: true, users: true },
        },
      },
    });
  }

  async findById(id: string): Promise<Company | null> {
    return this.prisma.company.findUnique({
      where: { id },
      include: {
        outlets: true,
        _count: {
          select: { outlets: true, users: true },
        },
      },
    });
  }

  async findBySlug(slug: string): Promise<Company | null> {
    return this.prisma.company.findUnique({
      where: { slug },
    });
  }

  async update(id: string, updateCompanyDto: UpdateCompanyDto): Promise<Company> {
    const company = await this.findById(id);
    if (!company) {
      throw new NotFoundException('Company not found');
    }

    if (updateCompanyDto.slug && updateCompanyDto.slug !== company.slug) {
      const existingCompany = await this.prisma.company.findUnique({
        where: { slug: updateCompanyDto.slug },
      });

      if (existingCompany) {
        throw new ConflictException('Company slug already exists');
      }
    }

    return this.prisma.company.update({
      where: { id },
      data: updateCompanyDto,
    });
  }

  async remove(id: string): Promise<Company> {
    const company = await this.findById(id);
    if (!company) {
      throw new NotFoundException('Company not found');
    }

    return this.prisma.company.delete({
      where: { id },
    });
  }
}