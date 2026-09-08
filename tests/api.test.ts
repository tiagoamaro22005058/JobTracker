import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextResponse } from 'next/server';
import { GET, POST } from '@/app/api/applications/route';
import { PATCH, DELETE } from '@/app/api/applications/[id]/route';
import { authenticatedClient } from '@/lib/api';
vi.mock('@/lib/api', () => ({ authenticatedClient: vi.fn() }));
const mockAuth = vi.mocked(authenticatedClient);
const validInput = {
  company_name: 'Acme',
  position: 'Designer',
  application_date: '2026-09-08',
  status: 'Applied',
  job_link: '',
  notes: '',
  location: '',
};
const id = 'a029bc2a-6b8c-4eb2-94cf-1c2ca0567b27';
const context = { params: Promise.resolve({ id }) };
const request = (body: unknown) =>
  new Request('http://localhost/api/applications', { method: 'POST', body: JSON.stringify(body) });
function setup() {
  const query = {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    range: vi.fn().mockResolvedValue({ data: [], error: null }),
    insert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
    single: vi
      .fn()
      .mockResolvedValue({ data: { id, ...validInput, user_id: 'owner' }, error: null }),
    maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
  };
  const supabase = { from: vi.fn().mockReturnValue(query) };
  mockAuth.mockResolvedValue({ supabase, user: { id: 'owner' } } as unknown as Awaited<
    ReturnType<typeof authenticatedClient>
  >);
  return { query, supabase };
}
beforeEach(() => vi.clearAllMocks());
describe('API access boundaries', () => {
  it('denies reads, creation, edits, and deletion without a session', async () => {
    mockAuth.mockResolvedValue({
      error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }),
    });
    expect((await GET()).status).toBe(401);
    expect((await POST(request(validInput))).status).toBe(401);
    expect((await PATCH(request({ status: 'Offer' }), context)).status).toBe(401);
    expect((await DELETE(request(null), context)).status).toBe(401);
  });
  it('scopes reads to the authenticated user', async () => {
    const { query } = setup();
    expect((await GET()).status).toBe(200);
    expect(query.eq).toHaveBeenCalledWith('user_id', 'owner');
  });
  it('assigns ownership server-side and rejects supplied ownership', async () => {
    const { query } = setup();
    expect((await POST(request(validInput))).status).toBe(201);
    expect(query.insert).toHaveBeenCalledWith({ ...validInput, user_id: 'owner' });
    expect((await POST(request({ ...validInput, user_id: 'victim' }))).status).toBe(400);
  });
  it('scopes updates and deletes to owner and returns 404 for inaccessible rows', async () => {
    const { query } = setup();
    expect((await PATCH(request({ status: 'Offer' }), context)).status).toBe(404);
    expect(query.eq).toHaveBeenCalledWith('id', id);
    expect(query.eq).toHaveBeenCalledWith('user_id', 'owner');
    query.eq.mockClear();
    expect((await DELETE(request(null), context)).status).toBe(404);
    expect(query.eq).toHaveBeenCalledWith('user_id', 'owner');
  });
  it('rejects empty updates, invalid IDs, and malformed JSON', async () => {
    setup();
    expect((await PATCH(request({}), context)).status).toBe(400);
    expect(
      (await PATCH(request({ status: 'Offer' }), { params: Promise.resolve({ id: 'invalid' }) }))
        .status,
    ).toBe(400);
    const malformed = new Request('http://localhost/api/applications', {
      method: 'POST',
      body: '{',
    });
    expect((await POST(malformed)).status).toBe(400);
  });
  it('loads additional batches beyond the database row limit', async () => {
    const { query } = setup();
    query.range
      .mockResolvedValueOnce({ data: Array(1000).fill({ id }), error: null })
      .mockResolvedValueOnce({ data: [{ id: 'last' }], error: null });
    const response = await GET();
    expect((await response.json()).length).toBe(1001);
    expect(query.range).toHaveBeenNthCalledWith(2, 1000, 1999);
  });
  it('reports a database failure without exposing database internals', async () => {
    const { query } = setup();
    query.range.mockResolvedValue({ data: null, error: { message: 'private SQL details' } });
    const response = await GET();
    expect(response.status).toBe(500);
    expect(await response.text()).not.toContain('private SQL details');
  });
});
