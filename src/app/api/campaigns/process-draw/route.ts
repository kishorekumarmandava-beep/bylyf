import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { FieldValue } from "firebase-admin/firestore";
import crypto from "crypto";

export async function POST(req: Request) {
  try {
    const { campaignId, couponsEarned } = await req.json();

    if (!campaignId || !couponsEarned) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const campaignRef = adminDb.collection("campaigns").doc(campaignId);
    
    // Run within a transaction to ensure atomic updates
    await adminDb.runTransaction(async (transaction) => {
      const campaignDoc = await transaction.get(campaignRef);
      if (!campaignDoc.exists) {
        throw new Error("Campaign not found");
      }

      const campaignData = campaignDoc.data()!;
      if (campaignData.status !== "active") {
        // If not active, we still increment? No, just return.
        // Wait, what if someone buys when it's not active? We shouldn't increment.
        return;
      }

      const newCoupons = (campaignData.currentCoupons || 0) + couponsEarned;
      const target = campaignData.targetCoupons || 0;

      const updates: any = {
        currentCoupons: FieldValue.increment(couponsEarned)
      };

      if (newCoupons >= target) {
        updates.status = "completed";
        updates.endedAt = FieldValue.serverTimestamp();

        // Pick a winner securely
        const entriesSnap = await adminDb.collection("lucky_draw_entries")
          .where("campaignId", "==", campaignId)
          .get();

        if (!entriesSnap.empty) {
          const entries = entriesSnap.docs.map(d => ({ id: d.id, ...d.data() }));
          
          // Secure random selection
          const randomArray = new Uint32Array(1);
          crypto.webcrypto.getRandomValues(randomArray);
          const randomIndex = randomArray[0] % entries.length;
          const winner = entries[randomIndex] as any;

          updates.winnerEntryId = winner.couponId;
          updates.winnerDetails = {
            name: winner.maskedName || "Participant",
            userId: winner.userId || "anonymous",
            orderId: winner.orderId || "unknown"
          };
        } else {
          updates.winnerEntryId = "NO_ENTRIES";
        }

        // Auto-rollover
        const settingsDoc = await adminDb.collection("settings").doc("agent_config").get();
        const autoRolloverPaused = settingsDoc.exists ? settingsDoc.data()?.autoRolloverPaused : false;

        if (!autoRolloverPaused) {
          const upSnap = await adminDb.collection("campaigns")
            .where("status", "==", "upcoming")
            .orderBy("createdAt", "asc")
            .limit(1)
            .get();

          if (!upSnap.empty) {
            const nextCamp = upSnap.docs[0];
            transaction.update(nextCamp.ref, {
              status: "active",
              startedAt: FieldValue.serverTimestamp()
            });
          }
        }
      }

      transaction.update(campaignRef, updates);
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Draw Process Error:", error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}
