import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { CategoriesService } from './categories.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Public } from '../auth/decorators/public.decorator';
import { UserRole } from '@prisma/client';

@ApiTags('Categories')
@Controller('categories')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  @Post()
  @Roles(UserRole.ADMIN, UserRole.OWNER)
  @ApiOperation({ summary: 'Create a new category' })
  async create(@Request() req: any, @Body() createCategoryDto: CreateCategoryDto) {
    const outletId = req.user?.outletId || (createCategoryDto as any).outletId;
    return this.categoriesService.create(createCategoryDto, outletId, req.user?.companyId);
  }

  @Public()
  @Get()
  @ApiOperation({ summary: 'Get all categories' })
  @ApiQuery({ name: 'outletId', required: false, type: String })
  async findAll(@Request() req: any, @Query('outletId') queryOutletId?: string) {
    const outletId = req.user?.outletId || queryOutletId;
    return this.categoriesService.findAll(outletId, req.user?.companyId);
  }

  @Public()
  @Get('active')
  @ApiOperation({ summary: 'Get active categories with products (public for customers)' })
  @ApiQuery({ name: 'outletId', required: false, type: String })
  async findActive(@Request() req: any, @Query('outletId') queryOutletId?: string) {
    const outletId = req.user?.outletId || queryOutletId;
    return this.categoriesService.findActive(outletId, req.user?.companyId);
  }

  @Get(':id')
  @Roles(UserRole.ADMIN, UserRole.OWNER, UserRole.CASHIER, UserRole.WAITER, UserRole.KITCHEN)
  @ApiOperation({ summary: 'Get category by ID' })
  async findOne(@Request() req: any, @Param('id') id: string) {
    return this.categoriesService.findById(id, req.user.outletId, req.user?.companyId);
  }

  @Put(':id')
  @Roles(UserRole.ADMIN, UserRole.OWNER)
  @ApiOperation({ summary: 'Update category' })
  async update(
    @Request() req: any,
    @Param('id') id: string,
    @Body() updateCategoryDto: UpdateCategoryDto,
  ) {
    return this.categoriesService.update(id, req.user.outletId, updateCategoryDto, req.user?.companyId);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN, UserRole.OWNER)
  @ApiOperation({ summary: 'Delete category' })
  async remove(@Request() req: any, @Param('id') id: string) {
    return this.categoriesService.remove(id, req.user.outletId, req.user?.companyId);
  }

  @Put('reorder')
  @Roles(UserRole.ADMIN, UserRole.OWNER)
  @ApiOperation({ summary: 'Reorder categories' })
  async reorder(@Request() req: any, @Body('categoryIds') categoryIds: string[]) {
    return this.categoriesService.reorder(req.user.outletId, categoryIds, req.user?.companyId);
  }
}