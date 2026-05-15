import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Post,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { Permissions } from '../auth/decorators/permissions.decorator';
import { RolesService } from './roles.service';
import { CreateRoleDto } from './dto/create-role.dto';
import { AssignPermissionDto } from './dto/assign-permission.dto';

@Controller('roles')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class RolesController {
  constructor(private readonly rolesService: RolesService) {}

  @Get()
  @Permissions('roles:read')
  findAllRoles() {
    return this.rolesService.findAllRoles();
  }

  @Get('permissions')
  @Permissions('roles:read')
  findAllPermissions() {
    return this.rolesService.findAllPermissions();
  }

  @Get(':id')
  @Permissions('roles:read')
  findOneRole(@Param('id', ParseIntPipe) id: number) {
    return this.rolesService.findOneRole(id);
  }

  @Post()
  @Permissions('roles:create')
  createRole(@Body() dto: CreateRoleDto) {
    return this.rolesService.createRole(dto);
  }

  @Post(':id/permissions')
  @Permissions('roles:update')
  assignPermission(
    @Param('id', ParseIntPipe) roleId: number,
    @Body() dto: AssignPermissionDto,
  ) {
    return this.rolesService.assignPermission(roleId, dto);
  }

  @Delete(':id/permissions/:permissionId')
  @Permissions('roles:update')
  removePermission(
    @Param('id', ParseIntPipe) roleId: number,
    @Param('permissionId', ParseIntPipe) permissionId: number,
  ) {
    return this.rolesService.removePermission(roleId, permissionId);
  }
}