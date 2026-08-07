import apiClient from './axios';
import type { ApiResponse, Institute } from '../types';

export async function fetchInstituteSettings(): Promise<Institute> {
  const { data } = await apiClient.get<ApiResponse<Institute>>('/institute/settings');
  if (!data.data) {
    throw new Error(data.message || 'Failed to load institute settings');
  }
  return data.data;
}

export async function updateInstituteSettings(formData: FormData): Promise<Institute> {
  const { data } = await apiClient.patch<ApiResponse<Institute>>('/institute/settings', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  if (!data.data) {
    throw new Error(data.message || 'Failed to update institute settings');
  }
  return data.data;
}
