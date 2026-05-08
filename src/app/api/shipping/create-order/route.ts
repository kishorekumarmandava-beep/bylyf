import { NextResponse } from "next/server";
import { createShiprocketOrder } from "@/lib/shiprocket";

export async function POST(req: Request) {
  try {
    const orderData = await req.json();
    const result = await createShiprocketOrder(orderData);
    
    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
