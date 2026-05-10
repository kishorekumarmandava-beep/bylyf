import { NextResponse } from "next/server";
import crypto from "crypto";

export async function POST(req: Request) {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = await req.json();

    const key_secret = process.env.RAZORPAY_KEY_SECRET?.trim();

    if (!key_secret) {
      return NextResponse.json({ error: "Razorpay secret is not configured" }, { status: 500 });
    }

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return NextResponse.json({ error: "Missing required payment fields" }, { status: 400 });
    }

    // Step 3: Verify Signature
    // Algorithm: HMAC-SHA256(order_id + "|" + payment_id, KEY_SECRET)
    const generated_signature = crypto
      .createHmac("sha256", key_secret)
      .update(razorpay_order_id + "|" + razorpay_payment_id)
      .digest("hex");

    if (generated_signature === razorpay_signature) {
      return NextResponse.json({ success: true, message: "Payment verified successfully" });
    } else {
      console.error("Signature Mismatch!", {
        generated: generated_signature,
        received: razorpay_signature
      });
      return NextResponse.json({ success: false, error: "Payment verification failed" }, { status: 400 });
    }
  } catch (error: any) {
    console.error("Verification Error:", error);
    return NextResponse.json({ error: "Internal Server Error during verification" }, { status: 500 });
  }
}
