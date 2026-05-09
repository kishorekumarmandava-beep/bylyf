import { NextResponse } from "next/server";
import Razorpay from "razorpay";

export async function POST(req: Request) {
  try {
    const { amount, currency = "INR", receipt } = await req.json();

    const key_id = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;
    const key_secret = process.env.RAZORPAY_KEY_SECRET;

    if (!key_id || !key_secret) {
      console.error("Missing Razorpay Keys in Environment");
      return NextResponse.json({ error: "Razorpay keys are not configured" }, { status: 500 });
    }

    const razorpay = new Razorpay({
      key_id: key_id,
      key_secret: key_secret,
    });

    if (!amount || isNaN(amount) || amount < 1) {
      return NextResponse.json({ error: "Invalid amount. Minimum ₹1.00 required." }, { status: 400 });
    }

    const options = {
      amount: Math.round(amount * 100), // Razorpay expects amount in paise
      currency,
      receipt,
    };

    console.log("Creating Razorpay Order with options:", options);
    
    const order = await razorpay.orders.create(options);
    console.log("Razorpay Order Created Successfully:", order.id);

    return NextResponse.json({
      id: order.id,
      amount: order.amount,
      currency: order.currency,
    });
  } catch (error: any) {
    console.error("Razorpay Order Error:", error);
    return NextResponse.json(
      { error: "Razorpay API Error: " + (error.message || error.description || "Unknown error") },
      { status: 500 }
    );
  }
}
