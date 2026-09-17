import { Role } from '../generated/prisma/client.js';
import { prisma } from '../lib/prisma';

type LiveClassAccessResult =
  | {
      status: 'authorized';
      user: { id: string; name: string; email: string; role: Role; instituteId: string };
      liveClass: NonNullable<Awaited<ReturnType<typeof findLiveClassInInstitute>>>;
    }
  | { status: 'unauthenticated' }
  | { status: 'not-found' }
  | { status: 'forbidden' };

async function findLiveClassInInstitute(id: string, instituteId: string) {
  return prisma.liveClass.findFirst({
    where: { id, batch: { instituteId } },
    include: { batch: { select: { id: true, instituteId: true, name: true } } },
  });
}

/**
 * Resolves a live class using the current database user and enforces its join
 * policy. A class outside the user's institute is deliberately indistinguishable
 * from a missing class; classes within the institute that a user cannot join are
 * reported as forbidden.
 */
export async function getLiveClassAccess(userId: string, liveClassId: string): Promise<LiveClassAccessResult> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, name: true, email: true, role: true, instituteId: true, isActive: true },
  });

  if (!user || !user.isActive) {
    return { status: 'unauthenticated' };
  }

  const liveClass = await findLiveClassInInstitute(liveClassId, user.instituteId);
  if (!liveClass) {
    return { status: 'not-found' };
  }

  if (user.role === Role.TEACHER || user.role === Role.SUPER_ADMIN) {
    return { status: 'authorized', user, liveClass };
  }

  if (user.role === Role.STUDENT) {
    const enrollment = await prisma.enrollment.findUnique({
      where: { studentId_batchId: { studentId: userId, batchId: liveClass.batchId } },
      select: { id: true },
    });

    if (enrollment) {
      return { status: 'authorized', user, liveClass };
    }
  }

  return { status: 'forbidden' };
}
