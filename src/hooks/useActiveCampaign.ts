"use client";

import { useState, useEffect } from "react";
import { db } from "@/lib/firebase";
import { collection, query, where, onSnapshot } from "firebase/firestore";

export function useActiveCampaign() {
  const [hasActiveCampaign, setHasActiveCampaign] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const q = query(
      collection(db, "campaigns"), 
      where("status", "in", ["active", "drawing"])
    );
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setHasActiveCampaign(!snapshot.empty);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching active campaign:", error);
      setHasActiveCampaign(false);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return { hasActiveCampaign, loading };
}
