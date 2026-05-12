import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";

export async function POST(req: Request) {
  try {
    const { productId, userId } = await req.json();

    if (!productId || !userId) {
      return NextResponse.json({ error: "Missing productId or userId" }, { status: 400 });
    }

    // 1. Verify that the user has a valid order for this product
    const ordersRef = adminDb.collection("orders");
    const q = ordersRef.where("userId", "==", userId);

    const querySnapshot = await q.get();
    let hasPurchased = false;

    querySnapshot.forEach((doc) => {
      const order = doc.data();
      const validStatuses = ["paid", "processing", "completed", "success"];
      
      if (validStatuses.includes(order.status)) {
        const itemFound = order.items?.some((item: any) => item.id === productId);
        if (itemFound) hasPurchased = true;
      }
    });

    if (!hasPurchased) {
      return NextResponse.json({ error: "No valid purchase found for this product" }, { status: 403 });
    }

    // 2. Fetch the digital file metadata from the private collection
    const contentQ = adminDb.collection("product_content").where("productId", "==", productId);
    const contentSnapshot = await contentQ.get();

    if (contentSnapshot.empty) {
      return NextResponse.json({ error: "Digital content not found for this product" }, { status: 404 });
    }

    const contentData = contentSnapshot.docs[0].data();

    // 3. Return the secure URL
    return NextResponse.json({ 
      url: contentData.fileUrl,
      fileName: contentData.fileName 
    });

  } catch (error: any) {
    console.error("Download API Error:", error);
    const errorMsg = error.message || error.toString();
    return NextResponse.json({ error: `API Error: ${errorMsg}` }, { status: 500 });
  }
}
