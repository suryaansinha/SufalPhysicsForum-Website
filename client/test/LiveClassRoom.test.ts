import assert from 'node:assert/strict';
import test from 'node:test';
import { getJaasMeetingProps, getLiveClassAndJaasToken } from '../src/pages/LiveClassRoom';

const liveClass = {
  id: 'live-class-id', batchId: 'batch-id', title: 'Mechanics', agenda: null,
  scheduledFor: '2026-09-17T10:00:00.000Z', durationMins: 60, jitsiRoomName: 'mechanics-room',
  status: 'SCHEDULED', createdAt: '2026-09-17T09:00:00.000Z',
};

test('LiveClassRoom requests an authenticated JaaS token and supplies it to the join result', async () => {
  const calls: Array<{ method: string; url: string; body?: unknown }> = [];
  const api = {
    get: async (url: string) => {
      calls.push({ method: 'get', url });
      return { data: { success: true, data: liveClass } };
    },
    post: async (url: string, body: unknown) => {
      calls.push({ method: 'post', url, body });
      return { data: { success: true, token: 'authenticated-jaas-jwt' } };
    },
  };
  const result = await getLiveClassAndJaasToken(liveClass.id, api as any);
  assert.deepEqual(calls, [
    { method: 'get', url: `/live-classes/${liveClass.id}` },
    { method: 'post', url: '/meetings/jaas-token', body: { liveClassId: liveClass.id } },
  ]);
  assert.deepEqual(result, { ok: true, liveClass, token: 'authenticated-jaas-jwt' });
  assert.equal(getJaasMeetingProps(liveClass, 'authenticated-jaas-jwt').jwt, 'authenticated-jaas-jwt');
});

test('LiveClassRoom presents token-request failures without producing a join token', async () => {
  const api = {
    get: async () => ({ data: { success: true, data: liveClass } }),
    post: async () => { throw new Error('token endpoint unavailable'); },
  };
  const result = await getLiveClassAndJaasToken(liveClass.id, api as any);
  assert.deepEqual(result, { ok: false, error: 'Failed to join live class' });
  assert.equal(result.ok, false);
});
