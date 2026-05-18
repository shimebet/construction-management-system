import { api } from './client';

export type ScheduleBaselineItem = {
  id: number;
  baselineId: number;
  taskId: number;
  plannedStart?: string | null;
  plannedEnd?: string | null;
  durationDays?: number | null;
  task?: {
    id: number;
    code: string;
    name: string;
    status: string;
    progress: string | number;
  };
};

export type ScheduleBaseline = {
  id: number;
  projectId: number;
  name: string;
  description?: string | null;
  version: string;
  status: string;
  approvedAt?: string | null;
  approvedBy?: number | null;
  createdAt: string;
  items?: ScheduleBaselineItem[];
};

export type CreateBaselinePayload = {
  projectId: number;
  name: string;
  version: string;
  description?: string;
};

export type UpdateBaselinePayload = Partial<CreateBaselinePayload>;

export const schedulesApi = {
  findByProject: async (projectId: number): Promise<ScheduleBaseline[]> => {
    const response = await api.get(`/schedules/projects/${projectId}/baselines`);
    return response.data;
  },

  createBaseline: async (
    data: CreateBaselinePayload,
  ): Promise<ScheduleBaseline> => {
    const response = await api.post('/schedules/baselines', data);
    return response.data;
  },

  findOne: async (id: number): Promise<ScheduleBaseline> => {
    const response = await api.get(`/schedules/baselines/${id}`);
    return response.data;
  },

  updateBaseline: async (
    id: number,
    data: UpdateBaselinePayload,
  ): Promise<ScheduleBaseline> => {
    const response = await api.patch(`/schedules/baselines/${id}`, data);
    return response.data;
  },

  approveBaseline: async (id: number): Promise<ScheduleBaseline> => {
    const response = await api.post(`/schedules/baselines/${id}/approve`);
    return response.data;
  },

  removeBaseline: async (id: number): Promise<ScheduleBaseline> => {
    const response = await api.delete(`/schedules/baselines/${id}`);
    return response.data;
  },
};