import { apiClient } from './client';

export interface ShopProfile {
  id: string;
  shop_name: string;
  owner_name: string;
  phone: string | null;
  city: string | null;
  employee_count: number;
  currency: string;
  onboarding_complete: boolean;
  created_at: string;
  updated_at: string;
}

export interface Employee {
  id: string;
  name: string;
  role: string;
  salary: number;
  phone: string | null;
  is_active: boolean;
  created_at: string;
}

export interface OnboardingData {
  shop_name: string;
  owner_name: string;
  city?: string;
  employee_count: number;
  estimated_total_debt: number;
  monthly_rent: number;
  monthly_salaries: number;
  monthly_bills: number;
}

export const shopApi = {
  get: () =>
    apiClient.get<ShopProfile | null>('/shop/').then((r) => r.data),

  update: (data: Partial<ShopProfile>) =>
    apiClient.patch<ShopProfile>('/shop/', data).then((r) => r.data),

  completeOnboarding: (data: OnboardingData) =>
    apiClient.post<ShopProfile>('/shop/onboarding', data).then((r) => r.data),

  listEmployees: () =>
    apiClient.get<Employee[]>('/shop/employees').then((r) => r.data),

  createEmployee: (data: { name: string; role: string; salary: number; phone?: string }) =>
    apiClient.post<Employee>('/shop/employees', data).then((r) => r.data),
};
