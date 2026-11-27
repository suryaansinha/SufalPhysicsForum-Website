import assert from 'node:assert/strict';
import test from 'node:test';
import { DoubtStatus, Role } from '../src/generated/prisma/client.js';
import { deleteDoubt, updateDoubt } from '../src/controllers/forum.controller';

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

test('updateDoubt returns 400 when no fields are provided', async () => {
  const res = response();
  await updateDoubt(
    {
      user: { userId: 'student-1', role: Role.STUDENT, instituteId: 'inst-1' },
      params: { id: 'q-1' },
      body: {},
      files: [],
    } as never,
    res as never
  );
  assert.equal(res.result.statusCode, 400);
});

test('deleteDoubt and updateDoubt export as functions', () => {
  assert.equal(typeof updateDoubt, 'function');
  assert.equal(typeof deleteDoubt, 'function');
  assert.equal(DoubtStatus.PENDING, 'PENDING');
  assert.equal(DoubtStatus.ANSWERED, 'ANSWERED');
});
