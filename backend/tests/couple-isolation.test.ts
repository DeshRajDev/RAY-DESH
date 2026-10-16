/// <reference path="../../declarations.d.ts" />
/// <reference path="../declarations.d.ts" />
import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app';

describe('Couple Access Control & API Envelope', () => {
  const app = createApp();

  it('health endpoint returns 200 with standard API envelope', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.status).toBe('healthy');
  });

  it('rejects unauthenticated requests to protected couple endpoints with 401', async () => {
    const res = await request(app).get('/api/v1/chat/messages');
    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('UNAUTHORIZED');
  });

  it('rejects unauthenticated requests to private memories with 401', async () => {
    const res = await request(app).get('/api/v1/memories');
    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('UNAUTHORIZED');
  });
});
