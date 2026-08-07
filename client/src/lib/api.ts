import axios from 'axios';
import type { InstitutePublic, FeePayment, FeeStats, MyFees } from '../types';

const api = axios.create({
  baseURL: '/api/v1',
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401 && !error.config._retry) {
      error.config._retry = true;
      const refreshToken = localStorage.getItem('refreshToken');
      if (refreshToken) {
        try {
          const { data } = await axios.post('/api/v1/auth/refresh', { refreshToken });
          localStorage.setItem('accessToken', data.accessToken);
          error.config.headers.Authorization = `Bearer ${data.accessToken}`;
          return api(error.config);
        } catch {
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
          window.location.href = '/login';
        }
      }
    }
    return Promise.reject(error);
  }
);

export const publicApi = axios.create({
  baseURL: '/api/v1/public',
  headers: { 'Content-Type': 'application/json' },
});

export const fetchInstitutePublicProfile = async (slug: string): Promise<InstitutePublic> => {
  const { data } = await publicApi.get(`/institute/${slug}`);
  return data.data;
};

export const fetchFeeStats = async (): Promise<FeeStats> => {
  const { data } = await api.get('/fees/stats');
  return data.data;
};

export const fetchFeePaymentsByBatch = async (batchId: string): Promise<FeePayment[]> => {
  const { data } = await api.get(`/fees/batch/${batchId}`);
  return data.data;
};

export const fetchMyFees = async (): Promise<MyFees> => {
  const { data } = await api.get('/fees/my');
  return data.data;
};

export const payFee = async (payload: {
  batchId: string;
  amount: number;
  paymentMethod: string;
  monthFor: string;
  transactionId?: string;
  remarks?: string;
}): Promise<FeePayment> => {
  const { data } = await api.post('/fees/pay', payload);
  return data.data;
};

export const createFeePayment = async (payload: {
  studentId: string;
  batchId: string;
  amount: number;
  paymentDate?: string;
  paymentMethod: string;
  transactionId?: string;
  monthFor: string;
  status?: string;
  remarks?: string;
}): Promise<FeePayment> => {
  const { data } = await api.post('/fees', payload);
  return data.data;
};

export default api;
