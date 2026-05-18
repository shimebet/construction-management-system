import { api } from './client';

export type Invoice = {
  id: number;
  projectId: number;
  code: string;
  title: string;
  description?: string | null;
  invoiceDate: string;
  dueDate?: string | null;
  subtotal: string | number;
  taxAmount: string | number;
  retentionAmount: string | number;
  advanceDeduction: string | number;
  totalAmount: string | number;
  status: string;
  payments?: Payment[];
};

export type Payment = {
  id: number;
  projectId: number;
  invoiceId?: number | null;
  code: string;
  type: string;
  status: string;
  amount: string | number;
  paymentDate?: string | null;
  reference?: string | null;
  paidBy?: string | null;
  paidTo?: string | null;
  notes?: string | null;
  invoice?: {
    id: number;
    code: string;
    title: string;
    totalAmount: string | number;
    status: string;
  } | null;
};

export type CashFlowSummary = {
  projectId: number;
  invoicedAmount: number;
  receivedAmount: number;
  expenseAmount: number;
  retentionHeld: number;
  advanceDeducted: number;
  netCashFlow: number;
  outstandingReceivable: number;
};

export const financeApi = {
  createInvoice: async (data: any): Promise<Invoice> => {
    const response = await api.post('/finance/invoices', data);
    return response.data;
  },

  findInvoices: async (projectId: number): Promise<Invoice[]> => {
    const response = await api.get(`/finance/projects/${projectId}/invoices`);
    return response.data;
  },

  createPayment: async (data: any): Promise<Payment> => {
    const response = await api.post('/finance/payments', data);
    return response.data;
  },

  findPayments: async (projectId: number): Promise<Payment[]> => {
    const response = await api.get(`/finance/projects/${projectId}/payments`);
    return response.data;
  },

  getCashFlow: async (projectId: number): Promise<CashFlowSummary> => {
    const response = await api.get(`/finance/projects/${projectId}/cash-flow`);
    return response.data;
  },
};