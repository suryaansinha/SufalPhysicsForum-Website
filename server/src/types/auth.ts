import { Role } from '../generated/prisma';

export interface AuthUser {
  userId: string;
  role: Role;
  instituteId: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}
