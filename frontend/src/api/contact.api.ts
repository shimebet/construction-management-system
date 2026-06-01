import { api } from './client';

export type ContactPayload = {
  name: string;
  email: string;
  phone?: string;
  company?: string;
  subject?: string;
  message: string;
};

export const contactApi = {
  send: async (data: ContactPayload) => {
    const response = await api.post('/contact', data);
    return response.data;
  },
};