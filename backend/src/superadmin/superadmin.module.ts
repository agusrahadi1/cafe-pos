import { Module } from '@nestjs/common';
import { SuperadminController } from './superadmin.controller';
import { SuperadminService } from './superadmin.service';
import { AuditLogsModule } from '../audit-logs/audit-logs.module';
import { AuthModule } from '../auth/auth.module';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [AuditLogsModule, AuthModule, ConfigModule],
  controllers: [SuperadminController],
  providers: [SuperadminService],
  exports: [SuperadminService],
})
export class SuperadminModule {}

