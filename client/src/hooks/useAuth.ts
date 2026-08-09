import { getAuthUser } from '../lib/auth';
import type { AuthUser } from '../lib/auth';

export function useAuth(): { user: AuthUser | null; role: string | null } {
  const user = getAuthUser();
  return { user, role: user?.role ?? null };
}
