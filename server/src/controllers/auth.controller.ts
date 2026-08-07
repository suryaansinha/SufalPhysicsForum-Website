import { Request, Response } from 'express';
import crypto from 'crypto';
import { OAuth2Client } from 'google-auth-library';
import { prisma } from '../lib/prisma';
import { hashPassword, comparePassword } from '../utils/password';
import { generateTokenPair, verifyRefreshToken, generateAccessToken } from '../utils/jwt';
import { Role } from '../generated/prisma/client.js';

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const googleClient = new OAuth2Client(GOOGLE_CLIENT_ID);

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

export async function registerInstitute(req: Request, res: Response): Promise<void> {
  try {
    const { instituteName, teacherName, email, password, phone } = req.body;

    if (!instituteName || !teacherName || !email || !password) {
      res.status(400).json({ message: 'instituteName, teacherName, email, and password are required' });
      return;
    }

    const slug = generateSlug(instituteName);

    const existingInstitute = await prisma.institute.findUnique({ where: { slug } });
    if (existingInstitute) {
      res.status(409).json({ message: 'An institute with this name already exists' });
      return;
    }

    const passwordHash = await hashPassword(password);

    const institute = await prisma.institute.create({
      data: {
        name: instituteName,
        slug,
        phone: phone || null,
        email,
      },
    });

    const user = await prisma.user.create({
      data: {
        instituteId: institute.id,
        name: teacherName,
        email,
        passwordHash,
        role: Role.TEACHER,
        phone: phone || null,
      },
    });

    const tokenPayload = {
      userId: user.id,
      role: user.role,
      instituteId: institute.id,
    };

    const tokens = generateTokenPair(tokenPayload);

    const hashedToken = crypto.createHash('sha256').update(tokens.refreshToken).digest('hex');
    await prisma.refreshToken.create({
      data: {
        userId: user.id,
        token: hashedToken,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });

    res.status(201).json({
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
      institute: {
        id: institute.id,
        name: institute.name,
        slug: institute.slug,
      },
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}

export async function login(req: Request, res: Response): Promise<void> {
  try {
    const { email, password, instituteSlug } = req.body;

    if (!email || !password) {
      res.status(400).json({ message: 'Email and password are required' });
      return;
    }

    let user;

    if (instituteSlug) {
      const institute = await prisma.institute.findUnique({ where: { slug: instituteSlug } });
      if (!institute) {
        res.status(404).json({ message: 'Institute not found' });
        return;
      }
      user = await prisma.user.findUnique({
        where: { email_instituteId: { email, instituteId: institute.id } },
        include: { institute: true },
      });
    } else {
      user = await prisma.user.findFirst({
        where: { email },
        include: { institute: true },
      });
    }

    if (!user) {
      res.status(401).json({ message: 'Invalid email or password' });
      return;
    }

    if (!user.isActive) {
      res.status(403).json({ message: 'Account is deactivated' });
      return;
    }

    const isPasswordValid = await comparePassword(password, user.passwordHash);
    if (!isPasswordValid) {
      res.status(401).json({ message: 'Invalid email or password' });
      return;
    }

    const tokenPayload = {
      userId: user.id,
      role: user.role,
      instituteId: user.instituteId,
    };

    const tokens = generateTokenPair(tokenPayload);

    const hashedToken = crypto.createHash('sha256').update(tokens.refreshToken).digest('hex');
    await prisma.refreshToken.create({
      data: {
        userId: user.id,
        token: hashedToken,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });

    res.json({
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
        isActive: user.isActive,
      },
      institute: {
        id: user.institute.id,
        name: user.institute.name,
        slug: user.institute.slug,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}

export async function googleLogin(req: Request, res: Response): Promise<void> {
  try {
    const { credential } = req.body;

    if (!credential) {
      res.status(400).json({ message: 'Google credential is required' });
      return;
    }

    if (!GOOGLE_CLIENT_ID) {
      res.status(500).json({ message: 'Google sign-in is not configured on the server' });
      return;
    }

    let email: string | undefined;

    try {
      const ticket = await googleClient.verifyIdToken({
        idToken: credential,
        audience: GOOGLE_CLIENT_ID,
      });
      email = ticket.getPayload()?.email;
    } catch {
      res.status(401).json({ message: 'Invalid Google credential' });
      return;
    }

    if (!email) {
      res.status(401).json({ message: 'Google account has no email address' });
      return;
    }

    const user = await prisma.user.findFirst({
      where: { email },
      include: { institute: true },
    });

    if (!user) {
      res.status(403).json({ message: 'Account not registered by Institute' });
      return;
    }

    if (!user.isActive) {
      res.status(403).json({ message: 'Account is deactivated' });
      return;
    }

    const tokenPayload = {
      userId: user.id,
      role: user.role,
      instituteId: user.instituteId,
    };

    const tokens = generateTokenPair(tokenPayload);

    const hashedToken = crypto.createHash('sha256').update(tokens.refreshToken).digest('hex');
    await prisma.refreshToken.create({
      data: {
        userId: user.id,
        token: hashedToken,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });

    res.json({
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
        isActive: user.isActive,
      },
      institute: {
        id: user.institute.id,
        name: user.institute.name,
        slug: user.institute.slug,
      },
    });
  } catch (error) {
    console.error('Google login error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}

export async function refresh(req: Request, res: Response): Promise<void> {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      res.status(400).json({ message: 'Refresh token is required' });
      return;
    }

    let payload;
    try {
      payload = verifyRefreshToken(refreshToken);
    } catch {
      res.status(401).json({ message: 'Invalid or expired refresh token' });
      return;
    }

    const hashedToken = crypto.createHash('sha256').update(refreshToken).digest('hex');
    const storedToken = await prisma.refreshToken.findUnique({
      where: { token: hashedToken },
    });

    if (!storedToken || storedToken.expiresAt < new Date()) {
      res.status(401).json({ message: 'Invalid or expired refresh token' });
      return;
    }

    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
    });

    if (!user || !user.isActive) {
      res.status(401).json({ message: 'User not found or deactivated' });
      return;
    }

    const newPayload = {
      userId: user.id,
      role: user.role,
      instituteId: user.instituteId,
    };

    const accessToken = generateAccessToken(newPayload);

    res.json({ accessToken });
  } catch (error) {
    console.error('Refresh error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}

export async function me(req: Request, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ message: 'Authentication required' });
      return;
    }

    const user = await prisma.user.findUnique({
      where: { id: req.user.userId },
      include: { institute: true },
    });

    if (!user) {
      res.status(404).json({ message: 'User not found' });
      return;
    }

    res.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
        isActive: user.isActive,
        createdAt: user.createdAt,
      },
      institute: {
        id: user.institute.id,
        name: user.institute.name,
        slug: user.institute.slug,
      },
    });
  } catch (error) {
    console.error('Me error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}
