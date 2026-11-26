import jwt from 'jsonwebtoken';

const ACCESS_TOKEN_EXPIRY = '15m';
const REFRESH_TOKEN_EXPIRY = '7d';

function readSecret(name: 'JWT_REFRESH_SECRET'): string {
  const secret = process.env[name];
  if (!secret || Buffer.byteLength(secret, 'utf8') < 32) {
    throw new Error(`${name} must be configured with at least 32 bytes`);
  }
  return secret;
}

function readAccessSecret(): string {
  const secret = process.env.JWT_ACCESS_SECRET || process.env.JWT_SECRET;
  if (!secret || Buffer.byteLength(secret, 'utf8') < 32) {
    throw new Error('JWT_ACCESS_SECRET or JWT_SECRET must be configured with at least 32 bytes');
  }
  return secret;
}

export function assertJwtSecretsConfigured(): void {
  const accessSecret = readAccessSecret();
  const refreshSecret = readSecret('JWT_REFRESH_SECRET');
  if (accessSecret === refreshSecret) {
    throw new Error('The access-token secret and JWT_REFRESH_SECRET must be different values');
  }
}

export interface TokenPayload {
  userId: string;
  role: string;
  instituteId: string;
}

export function generateAccessToken(payload: TokenPayload): string {
  return jwt.sign(payload, readAccessSecret(), { expiresIn: ACCESS_TOKEN_EXPIRY, algorithm: 'HS256' });
}

export function generateRefreshToken(payload: TokenPayload): string {
  return jwt.sign(payload, readSecret('JWT_REFRESH_SECRET'), { expiresIn: REFRESH_TOKEN_EXPIRY, algorithm: 'HS256' });
}

export function generateTokenPair(payload: TokenPayload): { accessToken: string; refreshToken: string } {
  return {
    accessToken: generateAccessToken(payload),
    refreshToken: generateRefreshToken(payload),
  };
}

export function verifyAccessToken(token: string): TokenPayload {
  return jwt.verify(token, readAccessSecret(), { algorithms: ['HS256'] }) as TokenPayload;
}

export function verifyRefreshToken(token: string): TokenPayload {
  return jwt.verify(token, readSecret('JWT_REFRESH_SECRET'), { algorithms: ['HS256'] }) as TokenPayload;
}
