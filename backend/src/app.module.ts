import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { CompaniesModule } from './companies/companies.module';
import { ProjectsModule } from './projects/projects.module';
import { RolesModule } from './roles/roles.module';
import { AuditModule } from './audit/audit.module';

@Module({
  imports: [PrismaModule, AuthModule, UsersModule, CompaniesModule, ProjectsModule, RolesModule, AuditModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}