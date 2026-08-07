export interface AuthUser {
  id: string;
  role: string;
}

export function getAuthUser(): AuthUser | null {
  try {
    const raw = localStorage.getItem('user');
    if (raw) {
      const parsed = JSON.parse(raw) as { id?: string; role?: string };
      if (parsed.id && parsed.role) return { id: parsed.id, role: parsed.role };
    }
  } catch {
    // ignore malformed local storage
  }
  return null;
}

export function getCurrentUserRole(): string | null {
  return getAuthUser()?.role ?? null;
}

export function isTeacherRole(role: string | null | undefined): boolean {
  return role === 'TEACHER' || role === 'SUPER_ADMIN';
}
