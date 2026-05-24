import { prisma } from '@/lib/prisma';

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
    },
  },
}));

import { GET } from '../user/status/route';

describe('GET /api/user/status', () => {
  const mockWalletAddress = '0x1234567890123456789012345678901234567890';

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return 400 if walletAddress is missing', async () => {
    const req = {
      url: 'http://localhost/api/user/status',
    } as Request;

    const res = await GET(req);
    const data = await res.json();

    expect(res.status).toBe(400);
    expect(data.error).toBe('Wallet address required');
  });

  it('should return 404 if user not found', async () => {
    (prisma.user.findUnique as any).mockResolvedValue(null);

    const req = {
      url: `http://localhost/api/user/status?walletAddress=${mockWalletAddress}`,
    } as Request;

    const res = await GET(req);
    const data = await res.json();

    expect(res.status).toBe(404);
    expect(data.error).toBe('User not found');
  });

  it('should return user status if found', async () => {
    const mockUser = {
      walletAddress: mockWalletAddress,
      xp: 100,
      tier: 'Spark',
      actions: [],
    };
    (prisma.user.findUnique as any).mockResolvedValue(mockUser);

    const req = {
      url: `http://localhost/api/user/status?walletAddress=${mockWalletAddress}`,
    } as Request;

    const res = await GET(req);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.user.walletAddress).toBe(mockWalletAddress);
  });
});
