import { api } from './client';

export type Rfi = {
  id: number;
  projectId: number;
  code: string;
  title: string;
  question: string;
  response?: string | null;
  status: string;
  priority: string;
  createdById?: number | null;
  assignedToId?: number | null;
  dueDate?: string | null;
  answeredAt?: string | null;
  closedAt?: string | null;
  createdBy?: {
    id: number;
    name: string;
    email: string;
  } | null;
  assignedTo?: {
    id: number;
    name: string;
    email: string;
  } | null;
};

export type CreateRfiPayload = {
  projectId: number;
  code: string;
  title: string;
  question: string;
  status?: string;
  priority?: string;
  assignedToId?: number;
  dueDate?: string;
};

export type RespondRfiPayload = {
  response: string;
  status?: string;
};

export const rfisApi = {
  findByProject: async (projectId: number): Promise<Rfi[]> => {
    const response = await api.get(`/rfis/project/${projectId}`);
    return response.data;
  },

  create: async (data: CreateRfiPayload): Promise<Rfi> => {
    const response = await api.post('/rfis', data);
    return response.data;
  },

  update: async (
    id: number,
    data: Partial<CreateRfiPayload>,
  ): Promise<Rfi> => {
    const response = await api.patch(`/rfis/${id}`, data);
    return response.data;
  },

  respond: async (id: number, data: RespondRfiPayload): Promise<Rfi> => {
    const response = await api.patch(`/rfis/${id}/respond`, data);
    return response.data;
  },

  close: async (id: number): Promise<Rfi> => {
    const response = await api.patch(`/rfis/${id}/close`);
    return response.data;
  },
};