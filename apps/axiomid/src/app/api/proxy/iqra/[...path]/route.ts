import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { calculateTier, type Tier } from '@/lib/tiers';

const IQRA_INTERNAL_URL = process.env.IQRA_INTERNAL_URL || 'http://localhost:3000';
const IQRA_API_KEY = process.env.IQRA_API_KEY || '';
const PROXY_TIMEOUT_MS = 12_000;
const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX = 60;

const TIER_REQUIREMENTS: Record<string, Tier> = {
  'memory/resonate': 'Verified',
  'memory/layer': 'Verified',
  'conscience': 'Trusted',
  'mission': 'Trusted',
};

const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

function checkRateLimit(key: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(key);
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(key, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return true;
  }
  if (entry.count >= RATE_LIMIT_MAX) return false;
  entry.count++;
  return true;
}

function getTierRank(tier: Tier): number {
  const ranks: Record<Tier, number> = { Registered: 0, Verified: 1, Trusted: 2, Sovereign: 3 };
  return ranks[tier] ?? 0;
}

async function proxyRequest(
  request: NextRequest,
  params: { path: string[] },
  method: string
): Promise<NextResponse> {
  const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';

  if (!checkRateLimit(ip)) {
    console.warn(`[proxy] rate limit exceeded for ${ip}`);
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
  }

  const path = params.path.join('/');
  const walletAddress = request.headers.get('x-wallet-address');

  if (walletAddress) {
    const user = await prisma.user.findUnique({ where: { walletAddress } });
    const userTier = (user?.tier as Tier) || 'Registered';
    const requiredTier = Object.entries(TIER_REQUIREMENTS).find(([prefix]) =>
      path.startsWith(prefix)
    )?.[1];

    if (requiredTier && getTierRank(userTier) < getTierRank(requiredTier)) {
      console.warn(`[proxy] ${walletAddress} tier ${userTier} < required ${requiredTier} for /${path}`);
      return NextResponse.json(
        { error: `Tier ${requiredTier}+ required for this endpoint` },
        { status: 403 }
      );
    }

    if (requiredTier) {
      console.log(`[proxy] ${walletAddress} tier ${userTier} ✅ for /${path}`);
    }
  }

  const targetUrl = `${IQRA_INTERNAL_URL}/api/${path}`;

  let body: string | undefined;
  if (method !== 'GET' && method !== 'HEAD') {
    try {
      body = await request.text();
    } catch {
      body = undefined;
    }
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), PROXY_TIMEOUT_MS);

  const startTime = Date.now();

  try {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (IQRA_API_KEY) {
      headers['X-Api-Key'] = IQRA_API_KEY;
    }

    const response = await fetch(targetUrl, {
      method,
      headers,
      body: method !== 'GET' && method !== 'HEAD' ? body : undefined,
      signal: controller.signal,
    });

    const duration = Date.now() - startTime;
    const responseBody = await response.text();

    console.log(`[proxy] ${method} /api/${path} → ${response.status} (${duration}ms)`);

    return new NextResponse(responseBody, {
      status: response.status,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error: unknown) {
    const duration = Date.now() - startTime;
    if (error instanceof Error && error.name === 'AbortError') {
      console.error(`[proxy] timeout after ${PROXY_TIMEOUT_MS}ms: ${method} /api/${path}`);
      return NextResponse.json({ error: 'Upstream timeout' }, { status: 504 });
    }
    console.error(`[proxy] error ${method} /api/${path} (${duration}ms):`, error);
    return NextResponse.json({ error: 'Proxy error' }, { status: 502 });
  } finally {
    clearTimeout(timeoutId);
  }
}

export async function GET(request: NextRequest, context: { params: Promise<{ path: string[] }> }) {
  const params = await context.params;
  return proxyRequest(request, params, 'GET');
}

export async function POST(request: NextRequest, context: { params: Promise<{ path: string[] }> }) {
  const params = await context.params;
  return proxyRequest(request, params, 'POST');
}

export async function PUT(request: NextRequest, context: { params: Promise<{ path: string[] }> }) {
  const params = await context.params;
  return proxyRequest(request, params, 'PUT');
}

export async function DELETE(request: NextRequest, context: { params: Promise<{ path: string[] }> }) {
  const params = await context.params;
  return proxyRequest(request, params, 'DELETE');
}
