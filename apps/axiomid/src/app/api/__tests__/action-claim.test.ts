import { describe, it, expect, vi, beforeEach } from 'vitest';
import { prisma } from '@/lib/prisma';
import { ACTIONS } from '@/lib/actions';

// Mock next/server
vi.mock('next/server', () => ({
  NextResponse: {
    json: vi.fn((body, init) => ({
      status: init?.status || 200,
      json: async () => body,
    })),
  },
}));

// Mock prisma
vi.mock('@/lib/prisma', () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    action: {
      create: vi.fn(),
    },
  },
}));

import { POST } from '../action/claim/route';

describe('POST /api/action/claim', () => {
  const mockWalletAddress = '0x1234567890123456789012345678901234567890';

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return 400 if parameters are missing', async () => {
    const req = {
      json: async () => ({ walletAddress: mockWalletAddress }),
    } as Request;

    const res = await POST(req);
    const data = await res.json();

    expect(res.status).toBe(400);
    expect(data.error).toBe('Missing parameters');
  });

  it('should return 400 for invalid action type', async () => {
    const req = {
      json: async () => ({ walletAddress: mockWalletAddress, actionType: 'invalid' }),
    } as Request;

    const res = await POST(req);
    const data = await res.json();

    expect(res.status).toBe(400);
    expect(data.error).toBe('Invalid action type');
  });

  it('should return 404 if user is not found', async () => {
    (prisma.user.findUnique as any).mockResolvedValue(null);

    const req = {
      json: async () => ({ walletAddress: mockWalletAddress, actionType: 'connect_twitter' }),
    } as Request;

    const res = await POST(req);
    const data = await res.json();

    expect(res.status).toBe(404);
    expect(data.error).toBe('User not found');
  });

  it('should return 400 if non-repeatable action already claimed', async () => {
    (prisma.user.findUnique as any).mockResolvedValue({
      walletAddress: mockWalletAddress,
      actions: [{ type: 'connect_twitter' }],
    });

    const req = {
      json: async () => ({ walletAddress: mockWalletAddress, actionType: 'connect_twitter' }),
    } as Request;

    const res = await POST(req);
    const data = await res.json();

    expect(res.status).toBe(400);
    expect(data.error).toBe('Action already claimed');
  });

  it('should enforce 24h cooldown for daily_pow', async () => {
    const recentDate = new Date(Date.now() - 1000).toISOString();
    (prisma.user.findUnique as any).mockResolvedValue({
      walletAddress: mockWalletAddress,
      actions: [{ type: 'daily_pow', timestamp: recentDate }],
    });

    const req = {
      json: async () => ({ walletAddress: mockWalletAddress, actionType: 'daily_pow' }),
    } as Request;

    const res = await POST(req);
    const data = await res.json();

    expect(res.status).toBe(400);
    expect(data.error).toBe('Daily claim cooldown');
  });

  it('should successfully claim an action and update user', async () => {
    const mockUser = {
      id: 'user-1',
      walletAddress: mockWalletAddress,
      xp: 0,
      actions: [],
    };
    (prisma.user.findUnique as any).mockResolvedValue(mockUser);
    (prisma.action.create as any).mockResolvedValue({});
    (prisma.user.update as any).mockResolvedValue({
      ...mockUser,
      xp: 50,
      tier: 'Ghost',
    });

    const req = {
      json: async () => ({ walletAddress: mockWalletAddress, actionType: 'connect_twitter' }),
    } as Request;

    const res = await POST(req);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.earned).toBe(50);
    expect(prisma.action.create).toHaveBeenCalled();
    expect(prisma.user.update).toHaveBeenCalled();
  });
});
