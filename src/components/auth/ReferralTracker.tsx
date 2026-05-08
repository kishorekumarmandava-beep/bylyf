"use client";

import { useEffect } from "react";
import { useSearchParams } from "next/navigation";

export default function ReferralTracker() {
  const searchParams = useSearchParams();
  
  useEffect(() => {
    const ref = searchParams.get("ref");
    if (ref) {
      // Store referral code in local storage for 30 days
      localStorage.setItem("bylyf_referral_code", ref);
      localStorage.setItem("bylyf_referral_timestamp", Date.now().toString());
      console.log("Captured Referral Code:", ref);
    }
  }, [searchParams]);

  return null;
}
