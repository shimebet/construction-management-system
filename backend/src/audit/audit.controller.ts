import { Controller, Get, Param, ParseIntPipe, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { Permissions } from '../auth/decorators/permissions.decorator';
import { AuditService } from './audit.service';

@Controller('audit-logs')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class AuditController {
  constructor(private readonly auditService: AuditService) {}

  @Get()
  @Permissions('audit_logs:read')
  findAll() {
    return this.auditService.findAll();
  }

  @Get('project/:projectId')
  @Permissions('audit_logs:read')
  findByProject(@Param('projectId', ParseIntPipe) projectId: number) {
    return this.auditService.findByProject(projectId);
  }

  @Get('user/:userId')
  @Permissions('audit_logs:read')
  findByUser(@Param('userId', ParseIntPipe) userId: number) {
    return this.auditService.findByUser(userId);
  }
}