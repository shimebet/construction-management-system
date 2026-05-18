import { api } from './client';

export type Role = {
  id: number;
  name: string;
  description?: string | null;
  isSystem: boolean;
  rolePermissions?: RolePermission[];
};

export type Permission = {
  id: number;
  module: string;
  action: string;
  description?: string | null;
};

export type RolePermission = {
  id: number;
  roleId: number;
  permissionId: number;
  permission: Permission;
};

export type CreateRolePayload = {
  name: string;
  description?: string;
  isSystem?: boolean;
};

export const settingsApi = {
  findRoles: async (): Promise<Role[]> => {
    const response = await api.get('/roles');
    return response.data;
  },

  findPermissions: async (): Promise<Permission[]> => {
    const response = await api.get('/roles/permissions');
    return response.data;
  },

  createRole: async (data: CreateRolePayload): Promise<Role> => {
    const response = await api.post('/roles', data);
    return response.data;
  },

  assignPermission: async (
    roleId: number,
    permissionId: number,
  ): Promise<RolePermission> => {
    const response = await api.post(`/roles/${roleId}/permissions`, {
      permissionId,
    });
    return response.data;
  },

  removePermission: async (
    roleId: number,
    permissionId: number,
  ): Promise<RolePermission> => {
    const response = await api.delete(
      `/roles/${roleId}/permissions/${permissionId}`,
    );
    return response.data;
  },
};