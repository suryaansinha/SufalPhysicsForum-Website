import { Request, Response } from 'express';
import { createPrivateKey } from 'crypto';
import jwt from 'jsonwebtoken';
import { Role } from '../generated/prisma/client.js';
import { prisma } from '../lib/prisma';

const TOKEN_LIFETIME_SECONDS = 3 * 60 * 60;

function getJaasConfiguration(): { appId: string; keyId: string; privateKey: string } | null {
  const appId = process.env.JAAS_APP_ID;
  const keyId = process.env.JAAS_KEY_ID;
  const encodedPrivateKey = process.env.JAAS_PRIVATE_KEY;

  if (!appId || !keyId || !encodedPrivateKey) {
    return null;
  }

  try {
    const privateKey = Buffer.from(encodedPrivateKey, 'base64').toString('utf8');
    const key = createPrivateKey(privateKey);
    if (
      (key.asymmetricKeyType !== 'rsa' && key.asymmetricKeyType !== 'rsa-pss') ||
      (key.asymmetricKeyDetails?.modulusLength ?? 0) < 2048
    ) {
      return null;
    }
    return { appId, keyId, privateKey };
  } catch {
    return null;
  }
}

export async function createJaasToken(req: Request, res: Response): Promise<void> {
  const { liveClassId } = req.body as { liveClassId?: unknown };

  if (typeof liveClassId !== 'string' || liveClassId.trim().length === 0) {
    res.status(400).json({ success: false, message: 'liveClassId is required' });
    return;
  }

  const jaas = getJaasConfiguration();
  if (!jaas) {
    res.status(503).json({ success: false, message: 'Meeting service configuration error' });
    return;
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.userId },
      select: { id: true, name: true, email: true, role: true, instituteId: true, isActive: true },
    });

    if (!user || !user.isActive) {
      res.status(401).json({ success: false, message: 'Authentication required' });
      return;
    }

    const liveClass = await prisma.liveClass.findUnique({
      where: { id: liveClassId.trim() },
      select: {
        jitsiRoomName: true,
        batch: {
          select: {
            instituteId: true,
            enrollments: { where: { studentId: user.id }, select: { studentId: true } },
          },
        },
      },
    });

    const isTeacherOrAdmin = user.role === Role.TEACHER || user.role === Role.SUPER_ADMIN;
    const canJoin =
      liveClass?.batch.instituteId === user.instituteId &&
      (isTeacherOrAdmin || (user.role === Role.STUDENT && liveClass.batch.enrollments.length > 0));

    if (!liveClass || !canJoin) {
      res.status(404).json({ success: false, message: 'Live class not found' });
      return;
    }

    const iat = Math.floor(Date.now() / 1000);
    const isTeacher = user.role === Role.TEACHER;
    const payload: Record<string, unknown> = {
      aud: 'jitsi',
      iss: 'chat',
      sub: jaas.appId,
      room: liveClass.jitsiRoomName,
      nbf: iat,
      exp: iat + TOKEN_LIFETIME_SECONDS,
      context: {
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          avatar: '',
          moderator: isTeacher,
        },
        features: {
          livestreaming: isTeacher,
          recording: isTeacher,
          transcription: false,
          'outbound-call': false,
          'sip-outbound-call': false,
          'file-upload': true,
          'list-visitors': true,
        },
      },
    };

    // jsonwebtoken removes iat when noTimestamp is true. Preserve our explicit,
    // deterministic claim while still preventing the library from adding one.
    Object.defineProperty(payload, 'iat', { value: iat, enumerable: true, configurable: false });

    let token: string;
    try {
      token = jwt.sign(payload, jaas.privateKey, {
        algorithm: 'RS256',
        noTimestamp: true,
        mutatePayload: true,
        header: { kid: `${jaas.appId}/${jaas.keyId}`, typ: 'JWT', alg: 'RS256' },
      });
    } catch {
      res.status(503).json({ success: false, message: 'Meeting service configuration error' });
      return;
    }

    res.json({ success: true, token, room: liveClass.jitsiRoomName, expiresAt: iat + TOKEN_LIFETIME_SECONDS });
  } catch {
    res.status(500).json({ success: false, message: 'Unable to create meeting token' });
  }
}
