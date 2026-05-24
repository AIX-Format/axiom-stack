import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { calculateTier } from '@/lib/tiers';

export async function POST(request: Request) {
  try {
    const { accessToken, uid, walletAddress, username } = await request.json();

    if (typeof accessToken !== 'string' || !accessToken.trim()) {
      return NextResponse.json({ error: 'Access token required' }, { status: 401 });
    }

    const meRes = await fetch('https://api.minepi.com/v2/me', {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!meRes.ok) {
      return NextResponse.json({ error: 'Invalid Pi access token' }, { status: 401 });
    }

    const me: { uid: string; username: string } = await meRes.json();

    if (uid && me.uid !== uid) {
      return NextResponse.json({ error: 'UID does not match token' }, { status: 403 });
    }

    const resolvedWallet = walletAddress && typeof walletAddress === 'string'
      ? walletAddress
      : `pi:${me.uid}`;

    let user = await prisma.user.findUnique({
      where: { walletAddress: resolvedWallet },
      include: { actions: true, agent: true },
    });

    if (!user) {
      user = await prisma.user.create({
        data: {
          walletAddress: resolvedWallet,
          piUsername: username || me.username || null,
          xp: 0,
          tier: 'Registered',
        },
        include: { actions: true, agent: true },
      });
    } else if (username && username !== user.piUsername) {
      user = await prisma.user.update({
        where: { walletAddress: resolvedWallet },
        data: { piUsername: username },
        include: { actions: true, agent: true },
      });
    }

    const currentTier = calculateTier(user.xp);
    if (currentTier !== user.tier) {
      user = await prisma.user.update({
        where: { walletAddress: resolvedWallet },
        data: { tier: currentTier },
        include: { actions: true, agent: true },
      });
    }

    return NextResponse.json({ user });
  } catch (error) {
    console.error('Error in Pi auth:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
