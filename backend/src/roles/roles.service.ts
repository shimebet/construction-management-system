import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateRoleDto } from './dto/create-role.dto';
import { AssignPermissionDto } from './dto/assign-permission.dto';

@Injectable()
export class RolesService {
  constructor(private readonly prisma: PrismaService) {}

  findAllRoles() {
    return this.prisma.role.findMany({
      include: {
        rolePermissions: {
          include: {
            permission: true,
          },
        },
      },
      orderBy: { id: 'asc' },
    });
  }

  findAllPermissions() {
    return this.prisma.permission.findMany({
      orderBy: [{ module: 'asc' }, { action: 'asc' }],
    });
  }

  async findOneRole(id: number) {
    const role = await this.prisma.role.findUnique({
      where: { id },
      include: {
        rolePermissions: {
          include: {
            permission: true,
          },
        },
      },
    });

    if (!role) {
      throw new NotFoundException('Role not found');
    }

    return role;
  }

  createRole(dto: CreateRoleDto) {
    return this.prisma.role.create({
      data: {
        name: dto.name,
        description: dto.description,
        isSystem: dto.isSystem ?? false,
      },
    });
  }

  async assignPermission(roleId: number, dto: AssignPermissionDto) {
    await this.findOneRole(roleId);

    const permission = await this.prisma.permission.findUnique({
      where: { id: dto.permissionId },
    });

    if (!permission) {
      throw new NotFoundException('Permission not found');
    }

    return this.prisma.rolePermission.upsert({
      where: {
        roleId_permissionId: {
          roleId,
          permissionId: dto.permissionId,
        },
      },
      update: {},
      create: {
        roleId,
        permissionId: dto.permissionId,
      },
      include: {
        role: true,
        permission: true,
      },
    });
  }

  async removePermission(roleId: number, permissionId: number) {
    await this.findOneRole(roleId);

    return this.prisma.rolePermission.delete({
      where: {
        roleId_permissionId: {
          roleId,
          permissionId,
        },
      },
    });
  }
}