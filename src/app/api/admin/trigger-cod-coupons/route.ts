import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { FieldValue } from "firebase-admin/firestore";
import crypto from "crypto";

export async function POST(req: Request) {
  try {
    const { orderId } = await req.json();

    if (!orderId) {
      return NextResponse.json({ error: "Missing orderId" }, { status: 400 });
    }

    let results: any = {};
    
    await adminDb.runTransaction(async (transaction) => {
      const orderRef = adminDb.collection("orders").doc(orderId);
      const orderDoc = await transaction.get(orderRef);

      if (!orderDoc.exists) {
        throw new Error("Order not found");
      }

      const orderData = orderDoc.data()!;

      if (orderData.paymentMethod !== "cod") {
        throw new Error("This is not a Cash on Delivery (COD) order.");
      }

      if (orderData.couponsEarned && orderData.couponsEarned > 0) {
        throw new Error("Coupons have already been issued for this order.");
      }

      // Find active campaign
      const campSnap = await transaction.get(
        adminDb.collection("campaigns").where("status", "in", ["active", "drawing"])
      );

      let activeCampId = null;
      if (!campSnap.empty) {
        const active = campSnap.docs.find(d => d.data().status === "active");
        if (active) {
          activeCampId = active.id;
        } else {
          activeCampId = campSnap.docs[0].id;
        }
      }

      let generatedCouponIds: string[] = [];
      let couponsEarned = 0;

      const productDocsMap = new Map();
      for (const item of orderData.items) {
        if (!productDocsMap.has(item.id)) {
           const productRef = adminDb.collection("products").doc(item.id);
           const pDoc = await transaction.get(productRef);
           if (pDoc.exists) {
              productDocsMap.set(item.id, pDoc.data());
           }
        }
      }

      for (const item of orderData.items) {
        const productData = productDocsMap.get(item.id);
        
        if (productData && productData.luckyDrawEligible) {
           for (let j = 0; j < item.quantity; j++) {
              const randomArray = new Uint32Array(1);
              crypto.webcrypto.getRandomValues(randomArray);
              const randomNum = 10000 + (randomArray[0] % 90000);
              const couponId = `BY-${randomNum}`;
              generatedCouponIds.push(couponId);
              
              const entryRef = adminDb.collection("lucky_draw_entries").doc();
              transaction.set(entryRef, {
                couponId,
                campaignId: activeCampId || "legacy",
                userId: orderData.userId || "anonymous",
                maskedName: orderData.shippingAddress?.fullName ? orderData.shippingAddress.fullName.split(" ").map((n: string) => n.length > 1 ? n[0] + "***" : n + "***").join(" ") : "Participant",
                orderId: orderData.orderId || orderId,
                itemTitle: item.title,
                status: "active",
                createdAt: FieldValue.serverTimestamp()
              });
           }
        }
      }

      couponsEarned = generatedCouponIds.length;

      let commissionEarned = 0;
      if (couponsEarned > 0 && orderData.referralCode) {
         commissionEarned = couponsEarned * 500;
      }

      // Update Order
      transaction.update(orderRef, {
        status: "delivered", // Moving straight to delivered since cash is collected
        couponsEarned,
        couponIds: generatedCouponIds,
        agentCommission: commissionEarned
      });
      
      // Handle Agent Commission
      let agentDetails = null;
      let agentUid = null;
      
      if (orderData.referralCode && commissionEarned > 0) {
        const agentSnap = await transaction.get(
          adminDb.collection("users").where("role", "in", ["agent", "storefront_agent"])
        );
        
        const agentDoc = agentSnap.docs.find(d => 
          d.data().referralCode === orderData.referralCode || 
          d.id.slice(0, 8).toUpperCase() === orderData.referralCode
        );

        if (agentDoc) {
          agentDetails = agentDoc.data();
          agentUid = agentDoc.id;
          
          const commRef = adminDb.collection("commissions").doc();
          transaction.set(commRef, {
            agentUid,
            agentName: agentDetails.displayName || "Agent",
            amount: commissionEarned,
            saleAmount: orderData.total,
            orderId: orderData.orderId || orderId,
            customerName: orderData.shippingAddress?.fullName,
            couponsEarned,
            couponIds: generatedCouponIds,
            status: "earned",
            createdAt: FieldValue.serverTimestamp()
          });
        }
      }

      if (couponsEarned > 0 && orderData.userId) {
        const userRef = adminDb.collection("users").doc(orderData.userId);
        const oneYearFromNow = new Date();
        oneYearFromNow.setFullYear(oneYearFromNow.getFullYear() + 1);
        
        transaction.update(userRef, {
          loyaltyDiscountExpiresAt: oneYearFromNow,
          updatedAt: FieldValue.serverTimestamp()
        });
      }

      results = {
        success: true,
        couponsEarned,
        couponIds: generatedCouponIds,
        activeCampId,
        agentPhone: agentDetails?.phoneNumber,
        agentName: agentDetails?.displayName,
        commissionAmount: commissionEarned,
        customerPhone: orderData.shippingAddress?.phone,
        customerName: orderData.shippingAddress?.fullName,
        orderTotal: orderData.total,
        displayOrderId: orderData.orderId || orderId
      };
    });

    const protocol = req.headers.get("x-forwarded-proto") || "http";
    const host = req.headers.get("host") || "localhost:3000";
    const origin = `${protocol}://${host}`;

    if (results.couponsEarned > 0 && results.activeCampId) {
      try {
        await fetch(`${origin}/api/campaigns/process-draw`, {
           method: "POST",
           headers: { "Content-Type": "application/json" },
           body: JSON.stringify({
             campaignId: results.activeCampId,
             couponsEarned: results.couponsEarned
           })
        });
      } catch(e) { console.error("Process Draw Trigger failed", e); }
    }

    try {
      await fetch(`${origin}/api/whatsapp/notify`, {
         method: "POST",
         headers: { "Content-Type": "application/json" },
         body: JSON.stringify({
           type: "ORDER_CONFIRMATION",
           data: {
             customerPhone: results.customerPhone,
             customerName: results.customerName,
             orderId: results.displayOrderId,
             couponsEarned: results.couponsEarned,
             couponIds: results.couponIds,
             grandTotal: results.orderTotal,
             agentPhone: results.agentPhone,
             agentName: results.agentName,
             commissionAmount: results.commissionAmount
           }
         })
      });
    } catch(e) { console.error("WhatsApp Notify Trigger failed", e); }

    return NextResponse.json(results);
    
  } catch (error: any) {
    console.error("Trigger COD Error:", error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}
