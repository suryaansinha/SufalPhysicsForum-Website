import apiClient from './axios';
import type { ApiResponse, AttendanceRecord, AttendanceStatus, MyAttendanceRecord } from '../types';

export interface AttendanceRecordPayload {
  studentId: string;
  status: AttendanceStatus;
}

export interface BulkAttendancePayload {
  batchId: string;
  date: string;
  records: AttendanceRecordPayload[];
}

export async function fetchAttendanceByBatchAndDate(
  batchId: string,
  date: string
): Promise<AttendanceRecord[]> {
  const { data } = await apiClient.get<ApiResponse<AttendanceRecord[]>>(
    `/attendance/${batchId}/${date}`
  );
  return data.data ?? [];
}

export async function fetchMyAttendance(): Promise<MyAttendanceRecord[]> {
  const { data } = await apiClient.get<ApiResponse<MyAttendanceRecord[]>>('/attendance/my-records');
  return data.data ?? [];
}

export async function markBulkAttendance(payload: BulkAttendancePayload): Promise<{ count: number }> {
  const { data } = await apiClient.post<ApiResponse<{ count: number }>>('/attendance/bulk', payload);
  return data.data ?? { count: 0 };
}
