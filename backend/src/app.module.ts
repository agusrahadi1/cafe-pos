import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { RolesModule } from './roles/roles.module';
import { PermissionsModule } from './permissions/permissions.module';
import { CompaniesModule } from './companies/companies.module';
import { OutletsModule } from './outlets/outlets.module';
import { TablesModule } from './tables/tables.module';
import { QrCodesModule } from './qr-codes/qr-codes.module';
import { CategoriesModule } from './categories/categories.module';
import { ProductsModule } from './products/products.module';
import { VariantsModule } from './variants/variants.module';
import { ModifiersModule } from './modifiers/modifiers.module';
import { OrdersModule } from './orders/orders.module';
import { PaymentsModule } from './payments/payments.module';
import { CustomersModule } from './customers/customers.module';
import { SessionsModule } from './sessions/sessions.module';
import { AuditLogsModule } from './audit-logs/audit-logs.module';
import { ReportsModule } from './reports/reports.module';
import { HealthModule } from './health/health.module';
import { SuperadminModule } from './superadmin/superadmin.module';
import { TenantsModule } from './tenants/tenants.module';
import { UploadsModule } from './uploads/uploads.module';
import { InventoryModule } from './inventory/inventory.module';
import { ShiftsModule } from './shifts/shifts.module';
import { DiscountsModule } from './discounts/discounts.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env'],
    }),
    ThrottlerModule.forRoot([{
      ttl: 60000,
      limit: 100,
    }]),
    PrismaModule,
    AuthModule,
    UsersModule,
    RolesModule,
    PermissionsModule,
    CompaniesModule,
    OutletsModule,
    TablesModule,
    QrCodesModule,
    CategoriesModule,
    ProductsModule,
    VariantsModule,
    ModifiersModule,
    OrdersModule,
    PaymentsModule,
    CustomersModule,
    SessionsModule,
    AuditLogsModule,
    ReportsModule,
    HealthModule,
    SuperadminModule,
    TenantsModule,
    UploadsModule,
    InventoryModule,
    ShiftsModule,
    DiscountsModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}