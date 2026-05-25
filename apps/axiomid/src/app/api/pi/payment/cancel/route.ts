import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const { paymentId } = await request.json();
    if (!paymentId) {
      return NextResponse.json({ error: "paymentId is required" }, { status: 400 });
    }

    return NextResponse.json({ success: true, paymentId });
  } catch (error) {
    console.error("Error cancelling payment:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
