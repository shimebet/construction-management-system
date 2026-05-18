import { api } from './client';

export type Submittal = {
  id: number;
  projectId: number;
  code: string;
  title: string;
  description?: string | null;
  status: string;
  revision?: string | null;
  submittedAt?: string | null;
  dueDate?: string | null;
  closedAt?: string | null;
  createdById?: number | null;
  reviewerId?: number | null;
  documentId?: number | null;
  document?: {
    id: number;
    code: string;
    title: string;
  } | null;
  reviewer?: {
    id: number;
    name: string;
    email: string;
  } | null;
};

export type CreateSubmittalPayload = {
  projectId: number;
  code: string;
  title: string;
  description?: string;
  status?: string;
  revision?: string;
  submittedAt?: string;
  dueDate?: string;
  reviewerId?: number;
  documentId?: number;
};

export type ReviewSubmittalPayload = {
  status: string;
  comments?: string;
};

export const submittalsApi = {
  findByProject: async (projectId: number): Promise<Submittal[]> => {
    const response = await api.get(`/submittals/project/${projectId}`);
    return response.data;
  },

  create: async (data: CreateSubmittalPayload): Promise<Submittal> => {
    const response = await api.post('/submittals', data);
    return response.data;
  },

  update: async (
    id: number,
    data: Partial<CreateSubmittalPayload>,
  ): Promise<Submittal> => {
    const response = await api.patch(`/submittals/${id}`, data);
    return response.data;
  },

  submit: async (id: number): Promise<Submittal> => {
    const response = await api.patch(`/submittals/${id}/submit`);
    return response.data;
  },

  review: async (
    id: number,
    data: ReviewSubmittalPayload,
  ): Promise<Submittal> => {
    const response = await api.patch(`/submittals/${id}/review`, data);
    return response.data;
  },

  close: async (id: number): Promise<Submittal> => {
    const response = await api.patch(`/submittals/${id}/close`);
    return response.data;
  },
};