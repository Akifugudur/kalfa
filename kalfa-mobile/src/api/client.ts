import axios from 'axios';

// Geliştirme: localhost (Android emülatör için 10.0.2.2)
// Production: gerçek sunucu URL'i
const BASE_URL = __DEV__
  ? 'http://10.0.2.2:8000/api' // Android emülatör
  : 'https://api.kalfa.app/api';

export const apiClient = axios.create({
  baseURL: BASE_URL,
  timeout: 10_000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// iOS simulator için: http://localhost:8000/api
// Gerçek cihaz için: bilgisayarın IP'si, ör. http://192.168.1.42:8000/api

apiClient.interceptors.response.use(
  (res) => res,
  (error) => {
    const message =
      error?.response?.data?.detail ?? error?.message ?? 'Bağlantı hatası';
    return Promise.reject(new Error(message));
  }
);
