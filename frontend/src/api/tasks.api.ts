import { api } from './client';

export type Task = {
  id: number;
  projectId: number;
  wbsItemId?: number | null;
  parentTaskId?: number | null;
  code: string;
  name: string;
  description?: string | null;
  status: string;
  priority: string;
  plannedStart?: string | null;
  plannedEnd?: string | null;
  actualStart?: string | null;
  actualEnd?: string | null;
  durationDays?: number | null;
  progress: string | number;
  assignedToId?: number | null;
  wbsItem?: {
    id: number;
    code: string;
    name: string;
  } | null;
};

export type CreateTaskPayload = {
  projectId: number;
  wbsItemId?: number | null;
  parentTaskId?: number | null;
  code: string;
  name: string;
  description?: string;
  status?: string;
  priority?: string;
  plannedStart?: string;
  plannedEnd?: string;
  durationDays?: number;
  progress?: number;
  assignedToId?: number;
};

export const tasksApi = {
  findByProject: async (projectId: number): Promise<Task[]> => {
    const response = await api.get(`/tasks/project/${projectId}`);
    return response.data;
  },

  create: async (data: CreateTaskPayload): Promise<Task> => {
    const response = await api.post('/tasks', data);
    return response.data;
  },

  update: async (
    id: number,
    data: Partial<CreateTaskPayload>,
  ): Promise<Task> => {
    const response = await api.patch(`/tasks/${id}`, data);
    return response.data;
  },

  remove: async (id: number): Promise<Task> => {
    const response = await api.delete(`/tasks/${id}`);
    return response.data;
  },
};