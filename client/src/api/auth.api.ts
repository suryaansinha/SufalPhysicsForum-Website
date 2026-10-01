import api from '../lib/api';

export interface AuthProfile {
  id: string;
  name: string;
  email: string;
  role: string;
}

interface ApiEnvelope<T> {
  success: boolean;
  message?: string;
  data: T;
}

export async function updateMyName(name: string): Promise<AuthProfile> {
  const { data } = await api.patch<ApiEnvelope<AuthProfile>>('/auth/me', { name });
  return data.data;
}
