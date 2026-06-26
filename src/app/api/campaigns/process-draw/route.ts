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
        return;
      }

      const oldCoupons = campaignData.currentCoupons || 0;
      const newCoupons = oldCoupons + couponsEarned;
      const target = campaignData.targetCoupons || 0;

      const updates: any = {
        currentCoupons: FieldValue.increment(couponsEarned)
      };

      const intermediateWinners = campaignData.intermediateWinners || [];
      const previousIntermediateWinnerEntryIds = new Set(intermediateWinners.map((w: any) => w.couponId));

      const oldMilestone = Math.floor(oldCoupons / 50);
      const newMilestone = Math.floor(newCoupons / 50);
      
      let newWinnersAdded = false;

      // Handle intermediate draws every 50 coupons
      if (newMilestone > oldMilestone) {
        const entriesSnap = await adminDb.collection("lucky_draw_entries")
          .where("campaignId", "==", campaignId)
          .get();
        const allEntries = entriesSnap.docs.map(d => ({ id: d.id, ...d.data() }));

        for (let m = oldMilestone + 1; m <= newMilestone; m++) {
           const milestoneNumber = m * 50;
           
           let prizeName = "Induction Stove / Bluetooth Earphone / Rice Cooker";
           if (milestoneNumber === 500 || milestoneNumber === 1000 || milestoneNumber === 1500) {
             prizeName = "5G Cellphone / Cycle";
           }

           const eligibleEntries = allEntries.filter((e: any) => !previousIntermediateWinnerEntryIds.has(e.couponId));
           
           if (eligibleEntries.length > 0) {
              const randomArray = new Uint32Array(1);
              crypto.webcrypto.getRandomValues(randomArray);
              const randomIndex = randomArray[0] % eligibleEntries.length;
              const winner = eligibleEntries[randomIndex] as any;
              
              intermediateWinners.push({
                 milestone: milestoneNumber,
                 prizeName,
                 couponId: winner.couponId,
                 name: winner.maskedName || "Participant",
                 userId: winner.userId || "anonymous",
                 orderId: winner.orderId || "unknown",
                 drawnAt: new Date().toISOString()
              });
              previousIntermediateWinnerEntryIds.add(winner.couponId);
              newWinnersAdded = true;
           }
        }
      }

      if (newWinnersAdded) {
         updates.intermediateWinners = intermediateWinners;
      }

      // Handle bumper draw if target is reached
      if (newCoupons >= target) {
        updates.status = "completed";
        updates.endedAt = FieldValue.serverTimestamp();

        // Pick a bumper winner securely (everyone is eligible)
        const entriesSnap = await adminDb.collection("lucky_draw_entries")
          .where("campaignId", "==", campaignId)
          .get();

        if (!entriesSnap.empty) {
          const entries = entriesSnap.docs.map(d => ({ id: d.id, ...d.data() }));
          
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
