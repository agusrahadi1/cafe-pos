import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { ModifiersService } from './modifiers.service';
import { CreateModifierGroupDto } from './dto/create-modifier-group.dto';
import { UpdateModifierGroupDto } from './dto/update-modifier-group.dto';
import { CreateModifierOptionDto } from './dto/create-modifier-option.dto';
import { UpdateModifierOptionDto } from './dto/update-modifier-option.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '@prisma/client';

@ApiTags('Modifiers')
@Controller('products/:productId/modifiers')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class ModifiersController {
  constructor(private readonly modifiersService: ModifiersService) {}

  // Modifier Group endpoints
  @Post('groups')
  @Roles(UserRole.ADMIN, UserRole.OWNER)
  @ApiOperation({ summary: 'Create a new modifier group for a product' })
  async createGroup(
    @Param('productId') productId: string,
    @Body() createModifierGroupDto: CreateModifierGroupDto,
  ) {
    return this.modifiersService.createGroup(productId, createModifierGroupDto);
  }

  @Get('groups')
  @Roles(UserRole.ADMIN, UserRole.OWNER, UserRole.CASHIER, UserRole.WAITER, UserRole.KITCHEN)
  @ApiOperation({ summary: 'Get all modifier groups for a product' })
  async findAllGroups(@Param('productId') productId: string) {
    return this.modifiersService.findAllGroups(productId);
  }

  @Get('groups/active')
  @ApiOperation({ summary: 'Get active modifier groups for a product (public)' })
  async findActiveGroups(@Param('productId') productId: string) {
    return this.modifiersService.findActiveGroups(productId);
  }

  @Get('groups/:id')
  @Roles(UserRole.ADMIN, UserRole.OWNER, UserRole.CASHIER, UserRole.WAITER, UserRole.KITCHEN)
  @ApiOperation({ summary: 'Get modifier group by ID' })
  async findGroupById(@Param('id') id: string) {
    return this.modifiersService.findGroupById(id);
  }

  @Put('groups/:id')
  @Roles(UserRole.ADMIN, UserRole.OWNER)
  @ApiOperation({ summary: 'Update modifier group' })
  async updateGroup(@Param('id') id: string, @Body() updateModifierGroupDto: UpdateModifierGroupDto) {
    return this.modifiersService.updateGroup(id, updateModifierGroupDto);
  }

  @Delete('groups/:id')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Delete modifier group' })
  async removeGroup(@Param('id') id: string) {
    return this.modifiersService.removeGroup(id);
  }

  @Put('groups/reorder')
  @Roles(UserRole.ADMIN, UserRole.OWNER)
  @ApiOperation({ summary: 'Reorder modifier groups' })
  async reorderGroups(
    @Param('productId') productId: string,
    @Body('groupIds') groupIds: string[],
  ) {
    return this.modifiersService.reorderGroups(productId, groupIds);
  }

  // Modifier Option endpoints
  @Post('groups/:groupId/options')
  @Roles(UserRole.ADMIN, UserRole.OWNER)
  @ApiOperation({ summary: 'Create a new modifier option' })
  async createOption(
    @Param('groupId') groupId: string,
    @Body() createModifierOptionDto: CreateModifierOptionDto,
  ) {
    return this.modifiersService.createOption(groupId, createModifierOptionDto);
  }

  @Get('groups/:groupId/options')
  @Roles(UserRole.ADMIN, UserRole.OWNER, UserRole.CASHIER, UserRole.WAITER, UserRole.KITCHEN)
  @ApiOperation({ summary: 'Get all modifier options for a group' })
  async findAllOptions(@Param('groupId') groupId: string) {
    return this.modifiersService.findAllOptions(groupId);
  }

  @Get('groups/:groupId/options/active')
  @ApiOperation({ summary: 'Get active modifier options for a group (public)' })
  async findActiveOptions(@Param('groupId') groupId: string) {
    return this.modifiersService.findActiveOptions(groupId);
  }

  @Get('options/:id')
  @Roles(UserRole.ADMIN, UserRole.OWNER, UserRole.CASHIER, UserRole.WAITER, UserRole.KITCHEN)
  @ApiOperation({ summary: 'Get modifier option by ID' })
  async findOptionById(@Param('id') id: string) {
    return this.modifiersService.findOptionById(id);
  }

  @Put('options/:id')
  @Roles(UserRole.ADMIN, UserRole.OWNER)
  @ApiOperation({ summary: 'Update modifier option' })
  async updateOption(
    @Param('id') id: string,
    @Body() updateModifierOptionDto: UpdateModifierOptionDto,
  ) {
    return this.modifiersService.updateOption(id, updateModifierOptionDto);
  }

  @Delete('options/:id')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Delete modifier option' })
  async removeOption(@Param('id') id: string) {
    return this.modifiersService.removeOption(id);
  }

  @Put('groups/:groupId/options/reorder')
  @Roles(UserRole.ADMIN, UserRole.OWNER)
  @ApiOperation({ summary: 'Reorder modifier options' })
  async reorderOptions(
    @Param('groupId') groupId: string,
    @Body('optionIds') optionIds: string[],
  ) {
    return this.modifiersService.reorderOptions(groupId, optionIds);
  }
}