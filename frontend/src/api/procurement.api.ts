import { api } from './client';

export type Supplier = {
  id: number;
  companyId: number;
  name: string;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  taxNumber?: string | null;
  isActive: boolean;
};

export type PurchaseRequest = {
  id: number;
  projectId: number;
  code: string;
  description?: string | null;
  status: string;
  requestedDate?: string | null;
  items?: any[];
};

export type PurchaseOrder = {
  id: number;
  projectId: number;
  supplierId?: number | null;
  code: string;
  description?: string | null;
  status: string;
  orderDate?: string | null;
  totalAmount?: string | number | null;
  supplier?: Supplier | null;
  items?: any[];
};

export const procurementApi = {
  createSupplier: async (data: any): Promise<Supplier> => {
    const response = await api.post('/procurement/suppliers', data);
    return response.data;
  },

  findSuppliers: async (companyId: number): Promise<Supplier[]> => {
    const response = await api.get(`/procurement/companies/${companyId}/suppliers`);
    return response.data;
  },

  createPurchaseRequest: async (data: any): Promise<PurchaseRequest> => {
    const response = await api.post('/procurement/purchase-requests', data);
    return response.data;
  },

  findPurchaseRequests: async (
    projectId: number,
  ): Promise<PurchaseRequest[]> => {
    const response = await api.get(
      `/procurement/projects/${projectId}/purchase-requests`,
    );
    return response.data;
  },

  createPurchaseOrder: async (data: any): Promise<PurchaseOrder> => {
    const response = await api.post('/procurement/purchase-orders', data);
    return response.data;
  },

  findPurchaseOrders: async (projectId: number): Promise<PurchaseOrder[]> => {
    const response = await api.get(
      `/procurement/projects/${projectId}/purchase-orders`,
    );
    return response.data;
  },
};