import { api } from './client';

export type Material = {
  id: number;
  companyId: number;
  code: string;
  name: string;
  unit: string;
  description?: string | null;
  minStock?: string | number | null;
};

export type InventoryTransaction = {
  id: number;
  projectId: number;
  materialId: number;
  type: string;
  quantity: string | number;
  unit: string;
  reference?: string | null;
  notes?: string | null;
  createdAt: string;
  material?: Material;
};

export type ProjectStock = {
  materialId: number;
  code: string;
  name: string;
  unit: string;
  minStock?: number | null;
  received: number;
  issued: number;
  returned: number;
  adjusted: number;
  balance: number;
  isLowStock: boolean;
};

export const inventoryApi = {
  createMaterial: async (data: any): Promise<Material> => {
    const response = await api.post('/inventory/materials', data);
    return response.data;
  },

  findMaterials: async (companyId: number): Promise<Material[]> => {
    const response = await api.get(`/inventory/companies/${companyId}/materials`);
    return response.data;
  },

  createTransaction: async (data: any): Promise<InventoryTransaction> => {
    const response = await api.post('/inventory/transactions', data);
    return response.data;
  },

  findTransactionsByProject: async (
    projectId: number,
  ): Promise<InventoryTransaction[]> => {
    const response = await api.get(`/inventory/projects/${projectId}/transactions`);
    return response.data;
  },

  getProjectStock: async (projectId: number): Promise<ProjectStock[]> => {
    const response = await api.get(`/inventory/projects/${projectId}/stock`);
    return response.data;
  },
};