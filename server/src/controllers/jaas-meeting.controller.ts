import { Request, Response } from 'express';
import { createPrivateKey } from 'crypto';
import jwt from 'jsonwebtoken';
import { Role } from '../generated/prisma/client.js';
import { getLiveClassAccess } from '../utils/live-class-access';

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
    const access = await getLiveClassAccess(req.user!.userId, liveClassId.trim());
    if (access.status === 'unauthenticated') {
      res.status(401).json({ success: false, message: 'Authentication required' });
      return;
    }

    if (access.status === 'not-found') {
      res.status(404).json({ success: false, message: 'Live class not found' });
      return;
    }

    if (access.status === 'forbidden') {
      res.status(403).json({ success: false, message: 'You are not enrolled in this live class' });
      return;
    }

    const { user, liveClass } = access;

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
