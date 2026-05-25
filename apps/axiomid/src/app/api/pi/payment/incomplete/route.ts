import { NextResponse } from "next/server";
import { getPiEnv } from "@/lib/pi/env";

export async function POST(request: Request) {
  try {
    const { paymentId, transactionId } = await request.json();
    if (!paymentId) {
      return NextResponse.json({ error: "paymentId is required" }, { status: 400 });
    }

    const { apiKey } = getPiEnv();

    const response = await fetch(
      `https://api.minepi.com/v2/payments/${paymentId}`,
      {
        headers: {
          Authorization: `Key ${apiKey}`,
        },
      }
    );

    if (!response.ok) {
      return NextResponse.json(
        { error: "Failed to fetch incomplete payment" },
        { status: response.status }
      );
    }

    const paymentData = await response.json();

    return NextResponse.json({ success: true, payment: paymentData });
  } catch (error) {
    console.error("Error handling incomplete payment:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
