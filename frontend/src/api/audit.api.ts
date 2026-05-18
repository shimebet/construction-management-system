import { api } from './client';

export type AuditLog = {
  id: number;
  userId?: number | null;
  projectId?: number | null;
  action: string;
  module: string;
  entityName: string;
  entityId?: string | null;
  description?: string | null;
  oldData?: any;
  newData?: any;
  ipAddress?: string | null;
  userAgent?: string | null;
  createdAt: string;
  user?: {
    id: number;
    name: string;
    email: string;
  } | null;
  project?: {
    id: number;
    code: string;
    name: string;
  } | null;
};

export const auditApi = {
  findAll: async (): Promise<AuditLog[]> => {
    const response = await api.get('/audit-logs');
    return response.data;
  },

  findByProject: async (projectId: number): Promise<AuditLog[]> => {
    const response = await api.get(`/audit-logs/project/${projectId}`);
    return response.data;
  },
};