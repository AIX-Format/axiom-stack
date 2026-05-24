import { NextRequest, NextResponse } from "next/server";
import { getClientIp } from "@/lib/ip";

/* ============================================
   SCORE API ROUTE
   Server-side validation for Digital DNA score
   ============================================ */

// Rate limiting: track request timestamps per IP
const requestLog = new Map<string, number[]>();

const RATE_LIMIT_WINDOW = 60_000; // 1 minute
const RATE_LIMIT_MAX = 10; // max 10 stamp additions per minute

// Allowed stamp definitions (server-side source of truth)
const VALID_STAMPS: Record<string, { maxXP: number; name: string }> = {
    twitter: { maxXP: 10, name: "X (Twitter)" },
    facebook: { maxXP: 10, name: "Facebook" },
    instagram: { maxXP: 10, name: "Instagram" },
    discord: { maxXP: 10, name: "Discord" },
    github: { maxXP: 20, name: "GitHub" },
    linkedin: { maxXP: 15, name: "LinkedIn" },
    wallet: { maxXP: 25, name: "Wallet" },
};

function isRateLimited(ip: string): boolean {
    const now = Date.now();
    const timestamps = requestLog.get(ip) || [];

    // Remove expired timestamps
    const valid = timestamps.filter((t) => now - t < RATE_LIMIT_WINDOW);
    requestLog.set(ip, valid);

    if (valid.length >= RATE_LIMIT_MAX) {
        return true;
    }

    valid.push(now);
    requestLog.set(ip, valid);
    return false;
}

/* GET — Return current score configuration */
export async function GET() {
    return NextResponse.json({
        protocol: "axiomid",
        version: "0.1.0",
        stamps: Object.entries(VALID_STAMPS).map(([id, info]) => ({
            id,
            name: info.name,
            maxXP: info.maxXP,
        })),
        levels: {
            ghost: { min: 0, max: 9, label: "Ghost" },
            spark: { min: 10, max: 29, label: "Spark" },
            pulse: { min: 30, max: 69, label: "Pulse" },
            axiom: { min: 70, max: null, label: "Axiom" },
        },
    });
}

/* POST — Validate a stamp claim */
export async function POST(request: NextRequest) {
    try {
        // Rate limit check
        const ip = getClientIp(request);

        if (isRateLimited(ip)) {
            return NextResponse.json(
                {
                    error: "Rate limited",
                    message: "Too many requests. Please wait before adding more stamps.",
                },
                { status: 429 }
            );
        }

        const body = await request.json();
        const { stampId, behaviorScore } = body;

        // Validate stamp ID
        if (!stampId || typeof stampId !== "string") {
            return NextResponse.json(
                { error: "Invalid request", message: "stampId is required" },
                { status: 400 }
            );
        }

        const stampConfig = VALID_STAMPS[stampId];
        if (!stampConfig) {
            return NextResponse.json(
                { error: "Invalid stamp", message: `Unknown stamp: ${stampId}` },
                { status: 400 }
            );
        }

        // Validate behavior score (Ghost tier security)
        if (typeof behaviorScore === "number") {
            // Flag suspicious behavior (perfect bot-like patterns)
            if (behaviorScore < 15) {
                return NextResponse.json(
                    {
                        error: "Verification failed",
                        message: "Behavioral analysis indicates automated activity.",
                        code: "BOT_DETECTED",
                    },
                    { status: 403 }
                );
            }
        }

        // Server-side stamp validation would go here (OAuth, wallet check, etc.)
        // For MVP, we trust the client but validate the stamp ID and XP value

        return NextResponse.json({
            success: true,
            stamp: {
                id: stampId,
                name: stampConfig.name,
                xp: stampConfig.maxXP,
                verifiedAt: Date.now(),
            },
        });
    } catch (error) {
        console.error("Stamp claim processing failed:", error);
        return NextResponse.json(
            { error: "Internal error", message: "Failed to process stamp claim" },
            { status: 500 }
        );
    }
}
