import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: Request) {
  try {
    const { walletAddress, accessToken } = await request.json();

    if (typeof walletAddress !== "string" || !walletAddress.trim()) {
      return NextResponse.json({ error: 'Wallet address required' }, { status: 400 });
    }
    const isPiWallet = walletAddress.toLowerCase().startsWith("pi:");

    if (isPiWallet) {
      if (typeof accessToken !== "string" || !accessToken.trim()) {
        return NextResponse.json({ error: 'Access token required for Pi wallets' }, { status: 401 });
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
    }

    const user = await prisma.user.findUnique({
      where: { walletAddress },
      include: { agent: true },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    if (!user.agent) {
      return NextResponse.json({ error: 'No agent found. Create one first.' }, { status: 400 });
    }

    const agent = await prisma.userAgent.update({
      where: { userId: user.id },
      data: {
        status: 'ACTIVE',
        lastActive: new Date(),
      },
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
    });

    return NextResponse.json({ agent });
  } catch (error) {
    console.error('Error activating agent:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
