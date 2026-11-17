import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { RolesService } from './roles.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '@prisma/client';

@ApiTags('Roles')
@Controller('roles')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class RolesController {
  constructor(private readonly rolesService: RolesService) {}

  @Post()
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Create a new role' })
  async create(@Body() body: { name: string; description?: string; permissionIds?: string[] }) {
    return this.rolesService.create(body.name, body.description, body.permissionIds);
  }

  @Get()
  @Roles(UserRole.ADMIN, UserRole.OWNER)
  @ApiOperation({ summary: 'Get all roles' })
  async findAll() {
    return this.rolesService.findAll();
  }

  @Get(':id')
  @Roles(UserRole.ADMIN, UserRole.OWNER)
  @ApiOperation({ summary: 'Get role by ID' })
  async findOne(@Param('id') id: string) {
    return this.rolesService.findById(id);
  }

  @Put(':id')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Update role' })
  async update(
    @Param('id') id: string,
    @Body() body: { name?: string; description?: string; permissionIds?: string[] },
  ) {
    return this.rolesService.update(id, body);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Delete role' })
  async remove(@Param('id') id: string) {
    return this.rolesService.remove(id);
  }
}