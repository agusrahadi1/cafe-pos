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
import { PermissionsService } from './permissions.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '@prisma/client';

@ApiTags('Permissions')
@Controller('permissions')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class PermissionsController {
  constructor(private readonly permissionsService: PermissionsService) {}

  @Post()
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Create a new permission' })
  async create(@Body() body: { name: string; description?: string }) {
    return this.permissionsService.create(body.name, body.description);
  }

  @Get()
  @Roles(UserRole.ADMIN, UserRole.OWNER)
  @ApiOperation({ summary: 'Get all permissions' })
  async findAll() {
    return this.permissionsService.findAll();
  }

  @Post('seed')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Seed default permissions' })
  async seedDefaults() {
    return this.permissionsService.seedDefaultPermissions();
  }

  @Get(':id')
  @Roles(UserRole.ADMIN, UserRole.OWNER)
  @ApiOperation({ summary: 'Get permission by ID' })
  async findOne(@Param('id') id: string) {
    return this.permissionsService.findById(id);
  }

  @Put(':id')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Update permission' })
  async update(
    @Param('id') id: string,
    @Body() body: { name?: string; description?: string },
  ) {
    return this.permissionsService.update(id, body);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Delete permission' })
  async remove(@Param('id') id: string) {
    return this.permissionsService.remove(id);
  }
}