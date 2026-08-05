import axios from 'axios';
import type { AxiosError, InternalAxiosRequestConfig } from 'axios';

const ACCESS_TOKEN_KEY = 'accessToken';
const REFRESH_TOKEN_KEY = 'refreshToken';

interface RetryableConfig extends InternalAxiosRequestConfig {
  _retry?: boolean;
}

function getAccessToken(): string | null {
  return localStorage.getItem(ACCESS_TOKEN_KEY);
}

export function clearAuthState(): void {
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
  localStorage.removeItem('user');
  localStorage.removeItem('userName');
  localStorage.removeItem('userEmail');
}

function redirectToLogin(): void {
  if (window.location.pathname !== '/login') {
    window.location.href = '/login';
  }
}

const apiClient = axios.create({
  baseURL: '/api/v1',
  headers: { 'Content-Type': 'application/json' },
});

apiClient.interceptors.request.use((config) => {
  const token = getAccessToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const status = error.response?.status;
    if (status !== 401) {
      return Promise.reject(error);
    }

    const config = error.config as RetryableConfig | undefined;
    const isAuthRequest = config?.url?.startsWith('/auth/') ?? false;

    if (!isAuthRequest && config && !config._retry) {
      config._retry = true;
      const refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);

      if (refreshToken) {
        try {
          const { data } = await axios.post('/api/v1/auth/refresh', { refreshToken });
          localStorage.setItem(ACCESS_TOKEN_KEY, data.accessToken);
          config.headers.Authorization = `Bearer ${data.accessToken}`;
          return apiClient(config);
        } catch {
          // Refresh failed - fall through to a graceful logout redirect
        }
      }
    }

    if (!isAuthRequest) {
      clearAuthState();
      redirectToLogin();
    }

    return Promise.reject(error);
  }
);

export default apiClient;
