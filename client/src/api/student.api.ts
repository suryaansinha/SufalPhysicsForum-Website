import apiClient from './axios';
import type { ApiResponse, Student } from '../types';

export interface CreateStudentPayload {
  name: string;
  email: string;
  phone?: string | null;
  batchId?: string | null;
}

export async function fetchStudents(): Promise<Student[]> {
  const { data } = await apiClient.get<ApiResponse<Student[]>>('/students');
  return data.data ?? [];
}

export interface CreateStudentResult {
  student: Student;
  tempPassword: string;
}

export async function createStudent(payload: CreateStudentPayload): Promise<CreateStudentResult> {
  const { data } = await apiClient.post<ApiResponse<CreateStudentResult>>('/students', payload);
  if (!data.data) {
    throw new Error(data.message || 'Failed to create student');
  }
  return data.data;
}
