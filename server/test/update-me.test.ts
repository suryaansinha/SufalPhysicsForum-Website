import assert from 'node:assert/strict';
import test from 'node:test';
import { Role } from '../src/generated/prisma/client.js';
import { updateMe } from '../src/controllers/auth.controller';

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

test('updateMe rejects names shorter than 2 characters', async () => {
  const res = response();
  await updateMe(
    {
      user: { userId: 'user-1', role: Role.STUDENT, instituteId: 'inst-1' },
      body: { name: 'A' },
    } as never,
    res as never
  );
  assert.equal(res.result.statusCode, 400);
});

test('updateMe rejects names longer than 80 characters', async () => {
  const res = response();
  await updateMe(
    {
      user: { userId: 'user-1', role: Role.STUDENT, instituteId: 'inst-1' },
      body: { name: 'A'.repeat(81) },
    } as never,
    res as never
  );
  assert.equal(res.result.statusCode, 400);
});

test('updateMe rejects a missing name', async () => {
  const res = response();
  await updateMe(
    {
      user: { userId: 'user-1', role: Role.STUDENT, instituteId: 'inst-1' },
      body: {},
    } as never,
    res as never
  );
  assert.equal(res.result.statusCode, 400);
});
