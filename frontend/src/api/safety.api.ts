import { api } from './client';

export type SafetyIncident = {
  id: number;
  projectId: number;
  code: string;
  title: string;
  description: string;
  severity: string;
  status: string;
  incidentDate: string;
  location?: string | null;
  correctiveAction?: string | null;
  closedAt?: string | null;
};

export type RiskAssessment = {
  id: number;
  projectId: number;
  code: string;
  activity: string;
  hazards: string;
  risks: string;
  controls?: string | null;
  riskLevel?: string | null;
  reviewDate?: string | null;
};

export type ToolboxTalk = {
  id: number;
  projectId: number;
  topic: string;
  talkDate: string;
  attendees?: any[];
  remarks?: string | null;
};

export type SafetyInspection = {
  id: number;
  projectId: number;
  code: string;
  inspectionDate: string;
  findings?: string | null;
  actions?: string | null;
};

export const safetyApi = {
  createIncident: async (data: any): Promise<SafetyIncident> => {
    const response = await api.post('/safety/incidents', data);
    return response.data;
  },

  findIncidents: async (projectId: number): Promise<SafetyIncident[]> => {
    const response = await api.get(`/safety/projects/${projectId}/incidents`);
    return response.data;
  },

  createRiskAssessment: async (data: any): Promise<RiskAssessment> => {
    const response = await api.post('/safety/risk-assessments', data);
    return response.data;
  },

  findRiskAssessments: async (projectId: number): Promise<RiskAssessment[]> => {
    const response = await api.get(
      `/safety/projects/${projectId}/risk-assessments`,
    );
    return response.data;
  },

  createToolboxTalk: async (data: any): Promise<ToolboxTalk> => {
    const response = await api.post('/safety/toolbox-talks', data);
    return response.data;
  },

  findToolboxTalks: async (projectId: number): Promise<ToolboxTalk[]> => {
    const response = await api.get(
      `/safety/projects/${projectId}/toolbox-talks`,
    );
    return response.data;
  },

  createSafetyInspection: async (data: any): Promise<SafetyInspection> => {
    const response = await api.post('/safety/inspections', data);
    return response.data;
  },

  findSafetyInspections: async (
    projectId: number,
  ): Promise<SafetyInspection[]> => {
    const response = await api.get(`/safety/projects/${projectId}/inspections`);
    return response.data;
  },
};