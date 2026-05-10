import { NextResponse } from "next/server";
import Razorpay from "razorpay";

export async function POST(req: Request) {
  const key_id = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID?.trim();
  const key_secret = process.env.RAZORPAY_KEY_SECRET?.trim();

  try {
    const { amount, currency = "INR", receipt } = await req.json();

    if (!key_id || !key_secret) {
      console.error("Missing Razorpay Keys in Environment");
      return NextResponse.json({ error: "Razorpay keys are not configured" }, { status: 500 });
    }

    console.log("Using Razorpay Key ID:", key_id.substring(0, 10) + "...", `(Length: ${key_id.length})`);
    console.log("Using Razorpay Secret prefix:", key_secret.substring(0, 4) + "...", `(Length: ${key_secret.length})`);

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
      receipt: receipt || `rcpt_${Date.now()}`,
    };

    console.log("Creating Razorpay Order with options:", JSON.stringify(options));
    
    const order = await razorpay.orders.create(options);
    console.log("Razorpay Order Created Successfully:", order.id);

    return NextResponse.json({
      id: order.id,
      amount: order.amount,
      currency: order.currency,
    });
  } catch (error: any) {
    console.error("Razorpay Order Error:", error);
    
    // Extract the most descriptive error message possible
    const errorMsg = error.message || 
                     (error.error && error.error.description) || 
                     error.description || 
                     (typeof error === 'string' ? error : JSON.stringify(error));

    const keyPrefix = key_id ? `(Key: ${key_id.substring(0, 14)}..., Len: ${key_id.length})` : "(Key missing)";
    const secretInfo = key_secret ? `(Secret: ${key_secret.substring(0, 4)}...${key_secret.substring(key_secret.length - 4)}, Len: ${key_secret.length})` : "(Secret missing)";

    return NextResponse.json(
      { error: `Razorpay API Error ${keyPrefix} ${secretInfo}: ` + errorMsg },
      { status: 500 }
    );
  }
}
