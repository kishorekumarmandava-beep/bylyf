import { NextResponse } from "next/server";
import { sendWhatsAppNotification } from "@/lib/whatsapp";

export async function POST(req: Request) {
  try {
    const { type, data } = await req.json();

    if (type === "ORDER_CONFIRMATION") {
      // Notify Customer
      await sendWhatsAppNotification({
        phone: data.customerPhone,
        templateName: "order_lucky_draw_confirm",
        variables: [
          data.customerName,
          data.orderId,
          data.couponsEarned.toString(),
          data.grandTotal.toString(),
          data.couponIds?.length > 0 ? data.couponIds.join(", ") : "N/A"
        ]
      });

      // Notify Agent if commission exists
      if (data.agentPhone && data.commissionAmount > 0) {
        await sendWhatsAppNotification({
          phone: data.agentPhone,
          templateName: "agent_commission_alert",
          variables: [
            data.agentName,
            data.customerName,
            data.commissionAmount.toString(),
          ]
        });
      }
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
