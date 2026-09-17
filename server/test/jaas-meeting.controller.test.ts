import assert from 'node:assert/strict';
import { generateKeyPairSync } from 'node:crypto';
import test from 'node:test';
import jwt from 'jsonwebtoken';
import { Role } from '../src/generated/prisma/client.js';
import { createJaasToken, createJaasTokenHandler } from '../src/controllers/jaas-meeting.controller';
import { authenticate } from '../src/middlewares/auth.middleware';

const { privateKey, publicKey } = generateKeyPairSync('rsa', { modulusLength: 2048 });
const privateKeyPem = privateKey.export({ type: 'pkcs8', format: 'pem' }).toString();
const publicKeyPem = publicKey.export({ type: 'spki', format: 'pem' }).toString();
const issuedAt = 1_700_000_000_000;

function response() {
  const result: { statusCode: number; body?: unknown } = { statusCode: 200 };
  return {
    result,
    status(code: number) {
      result.statusCode = code;
      return this;
    },
    json(body: unknown) {
      result.body = body;
      return this;
    },
  };
}

function authorizedAccess(role: Role) {
  return {
    status: 'authorized' as const,
    user: { id: `${role}-id`, name: 'Test User', email: 'test@example.com', role, instituteId: 'institute-id' },
    liveClass: { jitsiRoomName: 'physics-101', batchId: 'batch-id' },
  };
}

function handlerFor(role: Role) {
  return createJaasTokenHandler({
    getConfiguration: () => ({ appId: 'vpaas-app', keyId: 'console-key', privateKey: privateKeyPem }),
    getAccess: async () => authorizedAccess(role),
    now: () => issuedAt,
  });
}

test('returns a configuration error when JaaS credentials are missing', async () => {
  const original = { ...process.env };
  delete process.env.JAAS_APP_ID;
  delete process.env.JAAS_KEY_ID;
  delete process.env.JAAS_PRIVATE_KEY;
  const res = response();
  await createJaasToken({ body: { liveClassId: 'class-id' }, user: { userId: 'user', role: Role.STUDENT, instituteId: 'i' } } as any, res as any);
  assert.equal(res.result.statusCode, 503);
  assert.deepEqual(res.result.body, { success: false, message: 'Meeting service configuration error' });
  process.env = original;
});

test('rejects unauthenticated token endpoint requests', () => {
  const res = response();
  let nextCalled = false;
  authenticate({ headers: {} } as any, res as any, () => { nextCalled = true; });
  assert.equal(res.result.statusCode, 401);
  assert.equal(nextCalled, false);
});

for (const [role, moderator] of [[Role.STUDENT, false], [Role.TEACHER, true]] as const) {
  test(`issues ${role.toLowerCase()} JaaS claims`, async () => {
    const res = response();
    await handlerFor(role)({ body: { liveClassId: 'class-id' }, user: { userId: 'user', role, instituteId: 'i' } } as any, res as any);
    assert.equal(res.result.statusCode, 200);
    const body = res.result.body as { token: string };
    const decoded = jwt.verify(body.token, publicKeyPem, { algorithms: ['RS256'], clockTimestamp: issuedAt / 1000 }) as jwt.JwtPayload;
    assert.equal(decoded.context?.user?.moderator, moderator);
    assert.equal(decoded.context?.features?.livestreaming, moderator);
    assert.equal(decoded.context?.features?.recording, moderator);
  });
}

test('includes explicit three-hour timestamps and the required RS256 key header', async () => {
  const res = response();
  await handlerFor(Role.TEACHER)({ body: { liveClassId: 'class-id' }, user: { userId: 'user', role: Role.TEACHER, instituteId: 'i' } } as any, res as any);
  const body = res.result.body as { token: string };
  const decoded = jwt.verify(body.token, publicKeyPem, { algorithms: ['RS256'], clockTimestamp: issuedAt / 1000 }) as jwt.JwtPayload;
  const header = jwt.decode(body.token, { complete: true })?.header;
  assert.equal(decoded.iat, issuedAt / 1000);
  assert.equal(decoded.nbf, decoded.iat);
  assert.equal(decoded.exp, decoded.iat! + 3 * 60 * 60);
  assert.equal(header?.alg, 'RS256');
  assert.equal(header?.kid, 'vpaas-app/console-key');
});

test('rejects users who are not entitled to the requested live class', async () => {
  const handler = createJaasTokenHandler({
    getConfiguration: () => ({ appId: 'vpaas-app', keyId: 'console-key', privateKey: privateKeyPem }),
    getAccess: async () => ({ status: 'forbidden' }),
    now: () => issuedAt,
  });
  const res = response();
  await handler({ body: { liveClassId: 'class-id' }, user: { userId: 'user', role: Role.STUDENT, instituteId: 'i' } } as any, res as any);
  assert.equal(res.result.statusCode, 403);
  assert.deepEqual(res.result.body, { success: false, message: 'You are not enrolled in this live class' });
});
