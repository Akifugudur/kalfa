import { apiClient } from './client';
import type { AnalyticsDashboard, HomeStats } from '../types/api';

export const analyticsApi = {
  home: async () => {
    const res = await apiClient.get<HomeStats>('/analytics/home');
    return res.data;
  },

  dashboard: async (year?: number, month?: number) => {
    const res = await apiClient.get<AnalyticsDashboard>('/analytics/dashboard', {
      params: { year, month },
    });
    return res.data;
  },
};
