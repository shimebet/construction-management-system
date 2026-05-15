import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { AuditModule } from '../audit/audit.module';
import { CompaniesController } from './companies.controller';
import { CompaniesService } from './companies.service';

@Module({
  imports: [AuthModule, AuditModule],
  controllers: [CompaniesController],
  providers: [CompaniesService],
})
export class CompaniesModule {}