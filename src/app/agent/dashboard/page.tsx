"use client";

import React, { useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";

/**
 * Smart agent dashboard router.
 * - agent            → /agent/referral
 * - storefront_agent → /agent/storefront
 * - anything else    → /agent/apply
 */
export default function AgentDashboardRouter() {
  const { profile, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    if (!profile) {
      router.replace("/");
      return;
    }
    if (profile.role === "agent") {
      router.replace("/agent/referral");
    } else if (profile.role === "storefront_agent") {
      router.replace("/agent/storefront");
    } else if (profile.role === "admin") {
      router.replace("/admin/users");
    } else {
      router.replace("/agent/apply");
    }
  }, [profile, loading, router]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="font-black text-sm uppercase tracking-widest text-muted-foreground">Loading Agent Portal...</p>
      </div>
    </div>
  );
}
