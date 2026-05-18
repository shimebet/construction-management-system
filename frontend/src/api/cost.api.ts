import { api } from './client';

export type BoqItem = {
  id: number;
  projectId: number;
  code: string;
  description: string;
  unit: string;
  quantity: string | number;
  unitRate: string | number;
  totalAmount: string | number;
};

export type Budget = {
  id: number;
  projectId: number;
  code: string;
  title: string;
  description?: string | null;
  amount: string | number;
  status: string;
};

export type Expense = {
  id: number;
  projectId: number;
  code: string;
  description: string;
  type: string;
  amount: string | number;
  expenseDate: string;
  reference?: string | null;
  paidTo?: string | null;
};

export type Variation = {
  id: number;
  projectId: number;
  code: string;
  title: string;
  description: string;
  amount: string | number;
  status: string;
  submittedAt?: string | null;
  approvedAt?: string | null;
};

export type CostSummary = {
  projectId: number;
  boqTotal: number;
  budgetTotal: number;
  approvedVariationTotal: number;
  revisedBudget: number;
  actualCost: number;
  remainingBudget: number;
  costPerformancePercent: number;
};

export const costApi = {
  createBoqItem: async (data: any): Promise<BoqItem> => {
    const response = await api.post('/cost/boq-items', data);
    return response.data;
  },

  findBoqItems: async (projectId: number): Promise<BoqItem[]> => {
    const response = await api.get(`/cost/projects/${projectId}/boq-items`);
    return response.data;
  },

  createBudget: async (data: any): Promise<Budget> => {
    const response = await api.post('/cost/budgets', data);
    return response.data;
  },

  findBudgets: async (projectId: number): Promise<Budget[]> => {
    const response = await api.get(`/cost/projects/${projectId}/budgets`);
    return response.data;
  },

  createExpense: async (data: any): Promise<Expense> => {
    const response = await api.post('/cost/expenses', data);
    return response.data;
  },

  findExpenses: async (projectId: number): Promise<Expense[]> => {
    const response = await api.get(`/cost/projects/${projectId}/expenses`);
    return response.data;
  },

  createVariation: async (data: any): Promise<Variation> => {
    const response = await api.post('/cost/variations', data);
    return response.data;
  },

  findVariations: async (projectId: number): Promise<Variation[]> => {
    const response = await api.get(`/cost/projects/${projectId}/variations`);
    return response.data;
  },

  getSummary: async (projectId: number): Promise<CostSummary> => {
    const response = await api.get(`/cost/projects/${projectId}/summary`);
    return response.data;
  },
};