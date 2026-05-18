import { api } from './client';

export type RegisterPayload = {
  name: string;
  email: string;
  password: string;
  phone?: string;
  jobTitle?: string;
};

export type LoginPayload = {
  email: string;
  password: string;
};

export const authApi = {
  register: async (data: RegisterPayload) => {
    const response = await api.post('/auth/register', data);
    return response.data;
  },

  login: async (data: LoginPayload) => {
    const response = await api.post('/auth/login', data);
    return response.data;
  },
};