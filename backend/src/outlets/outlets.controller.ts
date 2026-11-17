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
import { OutletsService } from './outlets.service';
import { CreateOutletDto } from './dto/create-outlet.dto';
import { UpdateOutletDto } from './dto/update-outlet.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '@prisma/client';

@ApiTags('Outlets')
@Controller('outlets')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class OutletsController {
  constructor(private readonly outletsService: OutletsService) {}

  @Post()
  @Roles(UserRole.ADMIN, UserRole.OWNER)
  @ApiOperation({ summary: 'Create a new outlet' })
  async create(@Request() req: any, @Body() createOutletDto: CreateOutletDto) {
    return this.outletsService.create(createOutletDto, req.user.companyId);
  }

  @Get()
  @Roles(UserRole.ADMIN, UserRole.OWNER, UserRole.CASHIER)
  @ApiOperation({ summary: 'Get all outlets' })
  async findAll(@Request() req: any) {
    return this.outletsService.findAll(req.user.companyId);
  }

  @Get(':id')
  @Roles(UserRole.ADMIN, UserRole.OWNER, UserRole.CASHIER)
  @ApiOperation({ summary: 'Get outlet by ID' })
  async findOne(@Request() req: any, @Param('id') id: string) {
    return this.outletsService.findById(id, req.user.companyId);
  }

  @Put(':id')
  @Roles(UserRole.ADMIN, UserRole.OWNER)
  @ApiOperation({ summary: 'Update outlet' })
  async update(
    @Request() req: any,
    @Param('id') id: string,
    @Body() updateOutletDto: UpdateOutletDto,
  ) {
    return this.outletsService.update(id, req.user.companyId, updateOutletDto);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Delete outlet' })
  async remove(@Request() req: any, @Param('id') id: string) {
    return this.outletsService.remove(id, req.user.companyId);
  }

  @Get(':id/settings')
  @Roles(UserRole.ADMIN, UserRole.OWNER, UserRole.CASHIER)
  @ApiOperation({ summary: 'Get outlet settings' })
  async getSettings(@Request() req: any, @Param('id') id: string) {
    return this.outletsService.getSettings(id, req.user.companyId);
  }

  @Put(':id/settings')
  @Roles(UserRole.ADMIN, UserRole.OWNER)
  @ApiOperation({ summary: 'Update outlet settings' })
  async updateSettings(
    @Request() req: any,
    @Param('id') id: string,
    @Body() settings: any,
  ) {
    return this.outletsService.updateSettings(id, req.user.companyId, settings);
  }
}