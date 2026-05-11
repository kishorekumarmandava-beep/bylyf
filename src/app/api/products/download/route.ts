import { NextResponse } from "next/server";
import { db } from "@/lib/firebase";
import { collection, query, where, getDocs, doc, getDoc } from "firebase/firestore";

// NOTE: For production, use firebase-admin to securely fetch the digitalFileUrl 
// from a private collection. This implementation uses the client SDK on the server 
// and assumes the API has permission to read the product_content collection.

export async function POST(req: Request) {
  try {
    const { productId, userId } = await req.json();

    if (!productId || !userId) {
      return NextResponse.json({ error: "Missing productId or userId" }, { status: 400 });
    }

    // 1. Verify that the user has a paid order for this product
    const ordersRef = collection(db, "orders");
    const q = query(
      ordersRef,
      where("userId", "==", userId),
      where("status", "==", "paid")
    );

    const querySnapshot = await getDocs(q);
    let hasPurchased = false;

    querySnapshot.forEach((doc) => {
      const order = doc.data();
      const itemFound = order.items.some((item: any) => item.id === productId);
      if (itemFound) hasPurchased = true;
    });

    if (!hasPurchased) {
      return NextResponse.json({ error: "No valid purchase found for this product" }, { status: 403 });
    }

    // 2. Fetch the digital file metadata from the private collection
    // Since this is server-side, we can fetch it. 
    // IMPORTANT: Ensure your Firestore rules allow the server to read this.
    const contentQ = query(collection(db, "product_content"), where("productId", "==", productId));
    const contentSnapshot = await getDocs(contentQ);

    if (contentSnapshot.empty) {
      return NextResponse.json({ error: "Digital content not found for this product" }, { status: 404 });
    }

    const contentData = contentSnapshot.docs[0].data();

    // 3. Return the secure URL (In a real admin setup, generate a signed URL here)
    return NextResponse.json({ 
      url: contentData.fileUrl,
      fileName: contentData.fileName 
    });

  } catch (error: any) {
    console.error("Download API Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
