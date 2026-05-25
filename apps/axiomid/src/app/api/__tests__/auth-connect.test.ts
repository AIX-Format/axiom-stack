import { prisma } from '@/lib/prisma';
import { calculateTier } from '@/lib/tiers';

jest.mock('next/server', () => ({
  NextResponse: {
    json: jest.fn((body, init) => ({
      status: init?.status || 200,
      json: async () => body,
    })),
  },
}));

jest.mock('@/lib/prisma', () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
  },
}));

import { POST } from '../auth/connect/route';

describe('POST /api/auth/connect', () => {
  const mockWalletAddress = '0x1234567890123456789012345678901234567890';

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return 400 if walletAddress is missing', async () => {
    const req = {
      json: async () => ({}),
    } as Request;

    const res = await POST(req);
    const data = await res.json();

    expect(res.status).toBe(400);
    expect(data.error).toBe('Wallet address required');
  });

  it('should create a new user if not found', async () => {
    (prisma.user.findUnique as any).mockResolvedValue(null);
    (prisma.user.create as any).mockResolvedValue({
      walletAddress: mockWalletAddress,
      xp: 0,
      tier: 'Registered',
      actions: [],
    });

    const req = {
      json: async () => ({ walletAddress: mockWalletAddress }),
    } as Request;

    const res = await POST(req);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.user.walletAddress).toBe(mockWalletAddress);
    expect(prisma.user.create).toHaveBeenCalled();
  });

  it('should return 500 on internal error', async () => {
    (prisma.user.findUnique as any).mockRejectedValue(new Error('DB Error'));

    const req = {
      json: async () => ({ walletAddress: mockWalletAddress }),
    } as Request;

    const res = await POST(req);
    const data = await res.json();

    expect(res.status).toBe(500);
    expect(data.error).toBe('Internal server error');
  });
});