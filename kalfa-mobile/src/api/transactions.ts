import { apiClient } from './client';
import type {
  CreateCollectionPayload,
  CreateExpensePayload,
  CreateSalePayload,
  Transaction,
  TransactionType,
} from '../types/api';

export const transactionsApi = {
  list: async (params?: {
    type?: TransactionType;
    start_date?: string;
    end_date?: string;
    limit?: number;
  }) => {
    const res = await apiClient.get<Transaction[]>('/transactions/', { params });
    return res.data;
  },

  sale: async (data: CreateSalePayload) => {
    const res = await apiClient.post<Transaction>('/transactions/sale', data);
    return res.data;
  },

  collection: async (data: CreateCollectionPayload) => {
    const res = await apiClient.post<Transaction>('/transactions/collection', data);
    return res.data;
  },

  expense: async (data: CreateExpensePayload) => {
    const res = await apiClient.post<Transaction>('/transactions/expense', data);
    return res.data;
  },
};
