import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { randomBytes, createHash } from 'crypto';

const IQRA_INTERNAL_URL = process.env.IQRA_INTERNAL_URL || 'http://localhost:3000';

export async function POST(request: Request) {
  try {
    const { walletAddress, accessToken, name } = await request.json();

    if (typeof walletAddress !== 'string' || !walletAddress.trim()) {
      return NextResponse.json({ error: 'Wallet address required' }, { status: 400 });
    }
    if (typeof accessToken !== 'string' || !accessToken.trim()) {
      return NextResponse.json({ error: 'Access token required' }, { status: 401 });
    }

    const meRes = await fetch('https://api.minepi.com/v2/me', {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!meRes.ok) {
      return NextResponse.json({ error: 'Invalid Pi access token' }, { status: 401 });
    }

    const me: { uid: string } = await meRes.json();
    const expectedWallet = `pi:${me.uid}`.toLowerCase();
    if (expectedWallet !== walletAddress.toLowerCase()) {
      return NextResponse.json({ error: 'Wallet does not match token' }, { status: 403 });
    }

    const user = await prisma.user.findUnique({ where: { walletAddress } });
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const agentSelect = {
      id: true,
      userId: true,
      publicId: true,
      name: true,
      status: true,
      permissions: true,
      lastActive: true,
      createdAt: true,
      updatedAt: true,
    } as const;

    const existing = await prisma.userAgent.findUnique({ where: { userId: user.id } });
    if (existing) {
      const updated = await prisma.userAgent.update({
        where: { userId: user.id },
        data: { name: name || existing.name, status: 'ACTIVE', lastActive: new Date() },
        select: agentSelect,
      });

      try {
        await fetch(`${IQRA_INTERNAL_URL}/api/agent/init`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            agentId: updated.publicId,
            userId: user.id,
            walletAddress: user.walletAddress,
          }),
        });
      } catch (pingErr) {
        console.warn('[agent] iqra init ping failed:', pingErr);
      }

      return NextResponse.json({ agent: updated });
    }

    const rawKey = `axm_${randomBytes(24).toString('hex')}`;
    const apiKeyHash = createHash('sha256').update(rawKey).digest('hex');

    const agent = await prisma.userAgent.create({
      data: {
        userId: user.id,
        name: name || 'My Agent',
        status: 'ACTIVE',
        apiKeyHash,
        permissions: JSON.stringify(['claim', 'verify']),
        lastActive: new Date(),
      },
      select: agentSelect,
    });

    try {
      await fetch(`${IQRA_INTERNAL_URL}/api/agent/init`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agentId: agent.publicId,
          userId: user.id,
          walletAddress: user.walletAddress,
        }),
      });
    } catch (pingErr) {
      console.warn('[agent] iqra init ping failed:', pingErr);
    }

    return NextResponse.json({ agent, apiKey: rawKey });
  } catch (error) {
    console.error('Error activating agent:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const walletAddress = searchParams.get('walletAddress');
    const accessToken = searchParams.get('accessToken');

    if (!walletAddress) {
      return NextResponse.json({ error: 'Wallet address required' }, { status: 400 });
    }
    if (typeof accessToken !== 'string' || !accessToken.trim()) {
      return NextResponse.json({ error: 'Access token required' }, { status: 401 });
    }

    const meRes = await fetch('https://api.minepi.com/v2/me', {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!meRes.ok) {
      return NextResponse.json({ error: 'Invalid Pi access token' }, { status: 401 });
    }

    const me: { uid: string } = await meRes.json();
    const expectedWallet = `pi:${me.uid}`.toLowerCase();
    if (expectedWallet !== walletAddress.toLowerCase()) {
      return NextResponse.json({ error: 'Wallet does not match token' }, { status: 403 });
    }

    const user = await prisma.user.findUnique({
      where: { walletAddress },
      include: {
        agent: {
          select: {
            id: true,
            userId: true,
            publicId: true,
            name: true,
            status: true,
            permissions: true,
            lastActive: true,
            createdAt: true,
            updatedAt: true,
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({ agent: user.agent });
  } catch (error) {
    console.error('Error fetching agent:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
