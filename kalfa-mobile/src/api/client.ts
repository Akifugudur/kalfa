import axios from 'axios';
import { Platform } from 'react-native';

// API adresi seçimi (öncelik sırasıyla):
// 1. EXPO_PUBLIC_API_URL ortam değişkeni, ör. http://192.168.1.42:8000/api
// 2. Web: sayfanın açıldığı makinenin 8000 portu. Dükkândaki sunucuya
//    telefondan http://<sunucu-ip>:8081 ile girilince API de oraya gider.
// 3. Android emülatör (geliştirme): 10.0.2.2
// 4. Production
function resolveBaseUrl(): string {
  const fromEnv = process.env.EXPO_PUBLIC_API_URL;
  if (fromEnv) return fromEnv;

  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    return `http://${window.location.hostname}:8000/api`;
  }

  return __DEV__ ? 'http://10.0.2.2:8000/api' : 'https://api.kalfa.app/api';
}

const BASE_URL = resolveBaseUrl();

export const apiClient = axios.create({
  baseURL: BASE_URL,
  timeout: 10_000,
  headers: {
    'Content-Type': 'application/json',
  },
});

apiClient.interceptors.response.use(
  (res) => res,
  (error) => {
    const detail = error?.response?.data?.detail;
    // FastAPI doğrulama hataları liste döner: ilk mesajı göster
    const message = Array.isArray(detail)
      ? String(detail[0]?.msg ?? 'Geçersiz veri').replace(/^Value error, /, '')
      : detail ?? error?.message ?? 'Bağlantı hatası';
    return Promise.reject(new Error(message));
  }
);
