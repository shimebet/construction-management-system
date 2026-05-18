import { api } from './client';

export type QualityChecklist = {
  id: number;
  projectId: number;
  code: string;
  title: string;
  description?: string | null;
  items?: any[];
};

export type Inspection = {
  id: number;
  projectId: number;
  checklistId?: number | null;
  code: string;
  title: string;
  location?: string | null;
  inspectionDate?: string | null;
  status: string;
  result?: string | null;
};

export type NcrReport = {
  id: number;
  projectId: number;
  code: string;
  title: string;
  description: string;
  status: string;
  correctiveAction?: string | null;
  dueDate?: string | null;
  closedAt?: string | null;
};

export const qualityApi = {
  createChecklist: async (data: any): Promise<QualityChecklist> => {
    const response = await api.post('/quality/checklists', data);
    return response.data;
  },

  findChecklists: async (projectId: number): Promise<QualityChecklist[]> => {
    const response = await api.get(`/quality/projects/${projectId}/checklists`);
    return response.data;
  },

  createInspection: async (data: any): Promise<Inspection> => {
    const response = await api.post('/quality/inspections', data);
    return response.data;
  },

  findInspections: async (projectId: number): Promise<Inspection[]> => {
    const response = await api.get(`/quality/projects/${projectId}/inspections`);
    return response.data;
  },

  createNcr: async (data: any): Promise<NcrReport> => {
    const response = await api.post('/quality/ncrs', data);
    return response.data;
  },

  findNcrs: async (projectId: number): Promise<NcrReport[]> => {
    const response = await api.get(`/quality/projects/${projectId}/ncrs`);
    return response.data;
  },
};