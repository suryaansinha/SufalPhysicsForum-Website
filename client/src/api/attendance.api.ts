import apiClient from './axios';
import type { ApiResponse, AttendanceRecord, AttendanceRosterStudent, AttendanceStatus } from '../types';

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

export async function markBulkAttendance(payload: BulkAttendancePayload): Promise<{ count: number }> {
  const { data } = await apiClient.post<ApiResponse<{ count: number }>>('/attendance/bulk', payload);
  return data.data ?? { count: 0 };
}

export async function fetchAttendanceRoster(
  batchId: string,
  date: string
): Promise<AttendanceRosterStudent[]> {
  const { data } = await apiClient.get<ApiResponse<AttendanceRosterStudent[]>>(`/attendance/${batchId}`, {
    params: { date },
  });
  return data.data ?? [];
}

export async function saveBatchAttendance(
  batchId: string,
  date: string,
  records: AttendanceRecordPayload[]
): Promise<{ count: number }> {
  const { data } = await apiClient.post<ApiResponse<{ count: number }>>(`/attendance/${batchId}`, {
    date,
    records,
  });
  if (!data.success) {
    throw new Error(data.message || 'Failed to save attendance');
  }
  return data.data ?? { count: 0 };
}
