import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const { paymentId, error: errorMsg } = await request.json();
    if (!paymentId || !errorMsg) {
      return NextResponse.json({ error: "paymentId and error are required" }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error logging payment error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
