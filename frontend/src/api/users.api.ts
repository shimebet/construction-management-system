import { api } from './client';

export type User = {
  id: number;
  name: string;
  email: string;
  phone?: string | null;
  jobTitle?: string | null;
  status: string;
};

export type AssignCompanyUserPayload = {
  userId: number;
  roleId: number;
  status?: 'ACTIVE' | 'INACTIVE';
};

export type AssignProjectUserPayload = {
  userId: number;
  roleId: number;
  status?: 'ACTIVE' | 'INACTIVE';
};

export const usersApi = {
  findAll: async (): Promise<User[]> => {
    const response = await api.get('/users');
    return response.data;
  },

  assignToCompany: async (
    companyId: number,
    data: AssignCompanyUserPayload,
  ) => {
    const response = await api.post(`/companies/${companyId}/users`, data);
    return response.data;
  },

  assignToProject: async (
    projectId: number,
    data: AssignProjectUserPayload,
  ) => {
    const response = await api.post(`/projects/${projectId}/users`, data);
    return response.data;
  },
};