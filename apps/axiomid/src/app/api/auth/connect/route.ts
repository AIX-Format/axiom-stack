import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { calculateTier } from '@/lib/tiers';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { walletAddress, piUid, piUsername, accessToken } = body;

    if (typeof walletAddress !== "string" || !walletAddress.trim()) {
      console.error("[connect] invalid walletAddress", walletAddress);
      return NextResponse.json({ error: 'Wallet address required' }, { status: 400 });
    }
    if (piUid !== undefined && typeof piUid !== "string") {
      console.error("[connect] invalid piUid", piUid);
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
    }
    if (piUsername !== undefined && typeof piUsername !== "string") {
      console.error("[connect] invalid piUsername", piUsername);
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
    }

    const isPiWallet = walletAddress.startsWith("pi:");

    if (isPiWallet && (!accessToken || typeof accessToken !== "string")) {
      return NextResponse.json({ error: 'Pi wallet requires access token' }, { status: 401 });
    }

    if (!isPiWallet && !accessToken) {
      let user = await prisma.user.findUnique({
        where: { walletAddress },
        include: { actions: true, agent: true },
      });
      if (!user) {
        user = await prisma.user.create({
          data: { walletAddress, xp: 0, tier: 'Registered' },
          include: { actions: true, agent: true },
        });
      }
      return NextResponse.json({ user });
    }

    const meRes = await fetch('https://api.minepi.com/v2/me', {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!meRes.ok) {
      return NextResponse.json({ error: 'Invalid Pi access token' }, { status: 401 });
    }

    const me: { uid: string; username: string } = await meRes.json();

    if (piUid && me.uid !== piUid) {
      return NextResponse.json({ error: 'UID mismatch' }, { status: 403 });
    }

    const resolvedWallet = `pi:${me.uid}`;

    if (resolvedWallet !== walletAddress) {
      console.warn("[connect] walletAddress overridden: body said", walletAddress, "token says", resolvedWallet);
    }

    let user = await prisma.user.findUnique({
      where: { walletAddress: resolvedWallet },
      include: { actions: true, agent: true },
    });

    if (!user) {
      user = await prisma.user.create({
        data: {
          walletAddress: resolvedWallet,
          piUsername: piUsername || null,
          xp: 0,
          tier: 'Registered',
        },
        include: { actions: true, agent: true },
      });
    } else if (piUsername && piUsername !== user.piUsername) {
      user = await prisma.user.update({
        where: { walletAddress: resolvedWallet },
        data: { piUsername },
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
    console.error('Error connecting wallet:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
