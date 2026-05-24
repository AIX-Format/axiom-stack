import { NextResponse } from 'next/server';
import { getPiEnv } from '@/lib/pi/env';

export async function POST(request: Request) {
  try {
    const { paymentId } = await request.json();
    if (!paymentId) {
      return NextResponse.json({ error: 'paymentId is required' }, { status: 400 });
    }

    const { apiKey } = getPiEnv();

    const response = await fetch(`https://api.minepi.com/v2/payments/${paymentId}/approve`, {
      method: 'POST',
      headers: {
        'Authorization': `Key ${apiKey}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[Pi Approve Error] Status: ${response.status}`, errorText);
      return NextResponse.json({ error: 'Failed to approve payment with Pi Network' }, { status: response.status });
    }

    const data = await response.json();
    return NextResponse.json({ success: true, payment: data });
  } catch (error) {
    console.error('Error approving payment:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
