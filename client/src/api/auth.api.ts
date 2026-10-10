import api from '../lib/api';

export type ClassLevel = 'CLASS_9' | 'CLASS_10' | 'CLASS_11' | 'CLASS_12' | 'DROPPER';
export type TargetExam = 'JEE' | 'NEET' | 'BOARDS' | 'OTHERS';

export interface AuthProfile {
  id: string;
  name: string;
  email: string;
  role: string;
  classLevel: ClassLevel | null;
  targetExam: TargetExam | null;
}

export interface UpdateProfilePayload {
  name: string;
  classLevel?: ClassLevel | null;
  targetExam?: TargetExam | null;
}

interface ApiEnvelope<T> {
  success: boolean;
  message?: string;
  data: T;
  user?: AuthProfile;
}

function toAuthProfile(raw: Partial<AuthProfile> | undefined): AuthProfile | null {
  if (!raw?.id || !raw.name || !raw.email || !raw.role) return null;
  return {
    id: raw.id,
    name: raw.name,
    email: raw.email,
    role: raw.role,
    classLevel: raw.classLevel ?? null,
    targetExam: raw.targetExam ?? null,
  };
}

export async function getMyProfile(): Promise<AuthProfile> {
  const { data } = await api.get<ApiEnvelope<AuthProfile>>('/auth/me');
  const profile = toAuthProfile(data.data) ?? toAuthProfile(data.user);
  if (!profile) {
    throw new Error('Invalid profile response');
  }
  return profile;
}

export async function updateMyProfile(payload: UpdateProfilePayload): Promise<AuthProfile> {
  const { data } = await api.patch<ApiEnvelope<AuthProfile>>('/auth/me', payload);
  const profile = toAuthProfile(data.data);
  if (!profile) {
    throw new Error('Invalid profile response');
  }
  return profile;
}
