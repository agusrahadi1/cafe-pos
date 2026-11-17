import {
  Controller,
  Get,
  Query,
  Param,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { AuditLogsService } from './audit-logs.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '@prisma/client';

@ApiTags('Audit Logs')
@Controller('audit-logs')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class AuditLogsController {
  constructor(private readonly auditLogsService: AuditLogsService) {}

  @Get()
  @Roles(UserRole.ADMIN, UserRole.OWNER)
  @ApiOperation({ summary: 'Get audit logs with filters' })
  @ApiQuery({ name: 'outletId', required: false })
  @ApiQuery({ name: 'userId', required: false })
  @ApiQuery({ name: 'entity', required: false })
  @ApiQuery({ name: 'action', required: false })
  @ApiQuery({ name: 'dateFrom', required: false })
  @ApiQuery({ name: 'dateTo', required: false })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'offset', required: false, type: Number })
  async findAll(@Request() req: any, @Query() filters: any) {
    return this.auditLogsService.findAll(req.user.companyId, filters);
  }

  @Get('entity/:entity/:entityId')
  @Roles(UserRole.ADMIN, UserRole.OWNER)
  @ApiOperation({ summary: 'Get audit logs for specific entity' })
  async findByEntity(@Param('entity') entity: string, @Param('entityId') entityId: string) {
    return this.auditLogsService.findByEntity(entity, entityId);
  }
}