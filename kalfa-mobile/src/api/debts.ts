import { apiClient } from './client';
import type { CreateDebtPayload, Debt, DebtDirection } from '../types/api';

export const debtsApi = {
  list: async (params?: { direction?: DebtDirection; is_paid?: boolean }) => {
    const res = await apiClient.get<Debt[]>('/debts/', { params });
    return res.data;
  },

  create: async (data: CreateDebtPayload) => {
    const res = await apiClient.post<Debt>('/debts/', data);
    return res.data;
  },

  pay: async (id: string, paid_amount: number, note?: string) => {
    const res = await apiClient.post<Debt>(`/debts/${id}/pay`, {
      paid_amount,
      note,
    });
    return res.data;
  },

  delete: async (id: string) => {
    await apiClient.delete(`/debts/${id}`);
  },
};
