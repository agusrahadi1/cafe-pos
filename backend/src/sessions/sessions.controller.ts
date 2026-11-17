import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { SessionsService } from './sessions.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '@prisma/client';

@ApiTags('Sessions')
@Controller('sessions')
export class SessionsController {
  constructor(private readonly sessionsService: SessionsService) {}

  @Post('validate/:token')
  @ApiOperation({ summary: 'Validate session token for ordering (public)' })
  async validateSession(@Param('token') token: string) {
    return this.sessionsService.validateSessionForOrder(token);
  }

  @Get(':token')
  @ApiOperation({ summary: 'Get session info (public)' })
  async getSession(@Param('token') token: string) {
    return this.sessionsService.getSessionWithCart(token);
  }
}