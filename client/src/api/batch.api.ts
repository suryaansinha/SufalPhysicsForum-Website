import apiClient from './axios';
import type { ApiResponse, Batch } from '../types';

export interface CreateBatchPayload {
  name: string;
  gradeLevel?: string | null;
  grade?: string | null;
  targetExam?: string | null;
  subject?: string;
  timing?: string | null;
  feeAmount?: number | null;
}

export async function fetchBatches(): Promise<Batch[]> {
  const { data } = await apiClient.get<ApiResponse<Batch[]>>('/batches');
  return data.data ?? [];
}

export async function fetchBatch(batchId: string): Promise<Batch> {
  const { data } = await apiClient.get<ApiResponse<Batch>>(`/batches/${batchId}`);
  if (!data.data) {
    throw new Error(data.message || 'Failed to load batch');
  }
  return data.data;
}

export async function createBatch(payload: CreateBatchPayload): Promise<Batch> {
  const { data } = await apiClient.post<ApiResponse<Batch>>('/batches', payload);
  if (!data.data) {
    throw new Error(data.message || 'Failed to create batch');
  }
  return data.data;
}
