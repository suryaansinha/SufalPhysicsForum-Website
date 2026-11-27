import { prisma } from '../lib/prisma';
import { Role } from '../generated/prisma/client.js';
import { AuthUser } from '../types/auth';

/** Finds a batch only when it belongs to this user's institute and, for students, they are enrolled. */
export function findAccessibleBatch(batchId: string, user: AuthUser) {
  return prisma.batch.findFirst({
    where: {
      id: batchId,
      instituteId: user.instituteId,
      ...(user.role === Role.STUDENT
        ? { enrollments: { some: { studentId: user.userId } } }
        : {}),
    },
    select: { id: true },
  });
}
