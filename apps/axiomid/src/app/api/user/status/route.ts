import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const walletAddress = searchParams.get('walletAddress');

  if (!walletAddress) {
    return NextResponse.json({ error: 'Wallet address required' }, { status: 400 });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { walletAddress },
      include: { actions: true },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({ user });
  } catch (error) {
    console.error('Error fetching user status:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
