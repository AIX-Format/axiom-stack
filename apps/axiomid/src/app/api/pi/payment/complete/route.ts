import { NextResponse } from 'next/server';
import { getPiEnv } from '@/lib/pi/env';
import { prisma } from '@/lib/prisma';
import { calculateTier } from '@/lib/tiers';

export async function POST(request: Request) {
  try {
    const { paymentId, txid } = await request.json();
    if (!paymentId || !txid) {
      return NextResponse.json({ error: 'paymentId and txid are required' }, { status: 400 });
    }

    const { apiKey } = getPiEnv();

    const response = await fetch(`https://api.minepi.com/v2/payments/${paymentId}/complete`, {
      method: 'POST',
      headers: {
        'Authorization': `Key ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ txid })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[Pi Complete Error] Status: ${response.status}`, errorText);
      return NextResponse.json({ error: 'Failed to complete payment with Pi Network' }, { status: response.status });
    }

    const paymentData = await response.json();
    const userId = paymentData.metadata?.userId;
    const skillId = paymentData.metadata?.skillId;

    if (userId) {
      const xpReward = 50;
      
      const user = await prisma.user.findUnique({ where: { id: userId } });
      if (user) {
        const newXp = user.xp + xpReward;
        const newTier = calculateTier(newXp);
        
        await prisma.$transaction([
          prisma.user.update({
            where: { id: userId },
            data: { xp: newXp, tier: newTier }
          }),
          prisma.action.create({
            data: {
              userId,
              type: `purchase_skill_${skillId || 'unknown'}`,
              xp: xpReward
            }
          })
        ]);
      }
    }

    return NextResponse.json({ success: true, payment: paymentData });
  } catch (error) {
    console.error('Error completing payment:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
