import { api } from './client';

export type Approval = {
  id: number;
  projectId: number;
  userId?: number | null;
  status: string;
  module: string;
  entityName: string;
  entityId: number;
  comments?: string | null;
  approvedAt?: string | null;
  createdAt: string;
  project?: {
    id: number;
    code: string;
    name: string;
  };
  user?: {
    id: number;
    name: string;
    email: string;
  } | null;
};

export type CreateApprovalPayload = {
  projectId: number;
  userId?: number;
  status?: string;
  module: string;
  entityName: string;
  entityId: number;
  rfiId?: number;
  submittalId?: number;
  comments?: string;
};

export type ReviewApprovalPayload = {
  status: string;
  comments?: string;
};

export const approvalsApi = {
  findByProject: async (projectId: number): Promise<Approval[]> => {
    const response = await api.get(`/approvals/project/${projectId}`);
    return response.data;
  },

  findMyPending: async (): Promise<Approval[]> => {
    const response = await api.get('/approvals/my-pending');
    return response.data;
  },

  create: async (data: CreateApprovalPayload): Promise<Approval> => {
    const response = await api.post('/approvals', data);
    return response.data;
  },

  review: async (
    id: number,
    data: ReviewApprovalPayload,
  ): Promise<Approval> => {
    const response = await api.patch(`/approvals/${id}/review`, data);
    return response.data;
  },

  cancel: async (id: number): Promise<Approval> => {
    const response = await api.patch(`/approvals/${id}/cancel`);
    return response.data;
  },
};