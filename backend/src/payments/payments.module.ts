import { Module } from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { XenditService } from './xendit.service';
import { BorderPayService } from './borderpay.service';
import { PaymentsController } from './payments.controller';
import { InventoryModule } from '../inventory/inventory.module';

@Module({
  imports: [InventoryModule],
  controllers: [PaymentsController],
  providers: [PaymentsService, XenditService, BorderPayService],
  exports: [PaymentsService, XenditService, BorderPayService],
})
export class PaymentsModule {}