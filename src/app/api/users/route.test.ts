import { NextRequest } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const { list, create } = vi.hoisted(() => ({ list: vi.fn(), create: vi.fn() }));

vi.mock('@/lib/api/users', () => ({
  usersApi: { list, byId: vi.fn(), create },
}));

import { GET, POST } from './route';

beforeEach(() => {
  list.mockReset();
  create.mockReset();
});

describe('POST /api/users', () => {
  it('returns 422 with field messages for an invalid body', async () => {
    const request = new NextRequest('http://localhost/api/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'a', email: 'nope' }),
    });

    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(422);
    expect(body).toMatchObject({
      error: { code: 'validation_error' },
    });
    expect(body.error.fields.email).toBeDefined();
    expect(create).not.toHaveBeenCalled();
  });

  it('returns 400 bad_request when the body is not valid JSON', async () => {
    const request = new NextRequest('http://localhost/api/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: 'not json',
    });

    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body).toMatchObject({ error: { code: 'bad_request' } });
    expect(create).not.toHaveBeenCalled();
  });
});

describe('GET /api/users', () => {
  it('returns 422 with a fields.pageSize message when pageSize is out of range', async () => {
    const request = new NextRequest('http://localhost/api/users?pageSize=999');

    const response = await GET(request);
    const body = await response.json();

    expect(response.status).toBe(422);
    expect(body).toMatchObject({ error: { code: 'validation_error' } });
    expect(body.error.fields.pageSize).toBeDefined();
    expect(list).not.toHaveBeenCalled();
  });
});
