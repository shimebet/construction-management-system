import { api } from './client';

export type User = {
  id: number;
  name: string;
  email: string;
  phone?: string | null;
  jobTitle?: string | null;
  status: string;
};
export type CreateUserPayload = {
  name: string;
  email: string;
  password: string;
  phone?: string;
  jobTitle?: string;
  employeeId?: string;
  department?: string;
  employmentType?: string;
  gender?: string;
  nationality?: string;
  address?: string;
  emergencyName?: string;
  emergencyPhone?: string;
  educationLevel?: string;
  fieldOfStudy?: string;
  institution?: string;
  graduationYear?: number;
  yearsExperience?: number;
  previousCompany?: string;
};
export type UpdateUserPayload = {
  name?: string;
  email?: string;
  phone?: string;
  jobTitle?: string;
  status?: string;
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

update: async (id: number, data: UpdateUserPayload): Promise<User> => {
  const response = await api.patch(`/users/${id}`, data);
  return response.data;
},

 remove: async (id: number) => {
  const response = await api.delete(`/users/${id}`);
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

  create: async (data: CreateUserPayload): Promise<User> => {
  const response = await api.post('/users', data);
  return response.data;
},
};