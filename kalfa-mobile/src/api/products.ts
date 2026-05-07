import { apiClient } from './client';
import type {
  AddStockPayload,
  CreateProductPayload,
  Product,
  ProductListItem,
  SellProductPayload,
  Transaction,
} from '../types/api';

export const productsApi = {
  list: async (params?: { search?: string; low_stock_only?: boolean }) => {
    const res = await apiClient.get<ProductListItem[]>('/products/', { params });
    return res.data;
  },

  get: async (id: string) => {
    const res = await apiClient.get<Product>(`/products/${id}`);
    return res.data;
  },

  create: async (data: CreateProductPayload) => {
    const res = await apiClient.post<Product>('/products/', data);
    return res.data;
  },

  update: async (id: string, data: Partial<CreateProductPayload>) => {
    const res = await apiClient.patch<Product>(`/products/${id}`, data);
    return res.data;
  },

  delete: async (id: string) => {
    await apiClient.delete(`/products/${id}`);
  },

  addStock: async (id: string, data: AddStockPayload) => {
    const res = await apiClient.post<Product>(`/products/${id}/add-stock`, data);
    return res.data;
  },

  sell: async (id: string, data: SellProductPayload) => {
    const res = await apiClient.post<Transaction>(`/products/${id}/sell`, data);
    return res.data;
  },
};
