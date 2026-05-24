import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock next/server
vi.mock('next/server', () => ({
  NextResponse: {
    json: vi.fn((body, init) => ({
      status: init?.status || 200,
      json: async () => body,
    })),
  },
}));

import { GET, POST } from '../score/route';

describe('API /api/score', () => {
  describe('GET', () => {
    it('should return protocol configuration', async () => {
      const res = await GET();
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.protocol).toBe('axiomid');
      expect(data.stamps).toBeDefined();
      expect(data.levels).toBeDefined();
    });
  });

  describe('POST', () => {
    it('should return 400 for missing stampId', async () => {
      const req = {
        headers: new Map(),
        json: async () => ({}),
      } as unknown as Request;

      const res = await POST(req);
      const data = await res.json();

      expect(res.status).toBe(400);
      expect(data.error).toBe('Invalid request');
    });

    it('should return 400 for unknown stampId', async () => {
      const req = {
        headers: new Map(),
        json: async () => ({ stampId: 'unknown-service' }),
      } as unknown as Request;

      const res = await POST(req);
      const data = await res.json();

      expect(res.status).toBe(400);
      expect(data.error).toBe('Invalid stamp');
    });

    it('should return 403 for low behavior score', async () => {
      const req = {
        headers: new Map(),
        json: async () => ({ stampId: 'twitter', behaviorScore: 10 }),
      } as unknown as Request;

      const res = await POST(req);
      const data = await res.json();

      expect(res.status).toBe(403);
      expect(data.code).toBe('BOT_DETECTED');
    });

    it('should successfully validate a stamp claim', async () => {
      const req = {
        headers: new Map(),
        json: async () => ({ stampId: 'twitter', behaviorScore: 20 }),
      } as unknown as Request;

      const res = await POST(req);
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.stamp.id).toBe('twitter');
    });

    it('should enforce rate limiting', async () => {
      const headers = new Map();
      headers.set('x-forwarded-for', '1.2.3.4');

      const req = {
        headers,
        json: async () => ({ stampId: 'twitter', behaviorScore: 20 }),
      } as unknown as Request;

      // Send 10 requests (limit)
      for (let i = 0; i < 10; i++) {
        await POST(req);
      }

      // The 11th request should be rate limited
      const res = await POST(req);
      const data = await res.json();

      expect(res.status).toBe(429);
      expect(data.error).toBe('Rate limited');
    });
  });
});
