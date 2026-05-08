"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import Navbar from "@/components/layout/Navbar";
import { 
  Settings, 
  Save, 
  Percent, 
  Wallet, 
  Zap, 
  ShieldCheck,
  ChevronRight,
  Info
} from "lucide-react";
import { db } from "@/lib/firebase";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import toast from "react-hot-toast";

export default function AdminSettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  const [config, setConfig] = useState({
    commissionType: "fixed" as "fixed" | "percentage",
    commissionValue: 500,
    minSpendForCoupon: 999,
    drawTriggerCount: 1000,
  });

  useEffect(() => {
    const fetchConfig = async () => {
      const docRef = doc(db, "settings", "agent_config");
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        setConfig(docSnap.data() as any);
      }
      setLoading(false);
    };
    fetchConfig();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      await setDoc(doc(db, "settings", "agent_config"), {
        ...config,
        updatedAt: serverTimestamp(),
      });
      toast.success("Settings updated successfully!");
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center font-black">LOADING SETTINGS...</div>;

  return (
    <main className="min-h-screen bg-background">
      <Navbar />

      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="flex justify-between items-center mb-12">
          <div>
            <h1 className="text-4xl font-black tracking-tight">Global Settings</h1>
            <p className="text-muted-foreground mt-2">Configure commissions, coupons, and lucky draw triggers.</p>
          </div>
          <button 
            onClick={handleSave}
            disabled={saving}
            className="px-8 py-4 bg-primary text-primary-foreground rounded-2xl font-black flex items-center gap-2 hover:scale-105 transition-all shadow-xl shadow-primary/20 disabled:opacity-50"
          >
            {saving ? "Saving..." : "Save Settings"}
            <Save className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-8">
          {/* Agent Commission Config */}
          <div className="bg-secondary/30 rounded-[3rem] border border-border p-10">
            <h2 className="text-2xl font-black mb-8 flex items-center gap-3">
              <Wallet className="w-7 h-7 text-primary" />
              Referral Agent Commission
            </h2>

            <div className="space-y-8">
              <div className="grid grid-cols-2 gap-4 p-2 bg-background rounded-2xl border border-border">
                <button 
                  onClick={() => setConfig({...config, commissionType: "fixed"})}
                  className={cn(
                    "py-4 rounded-xl font-black flex items-center justify-center gap-2 transition-all",
                    config.commissionType === "fixed" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-secondary"
                  )}
                >
                  <Wallet className="w-5 h-5" /> Fixed Amount
                </button>
                <button 
                  onClick={() => setConfig({...config, commissionType: "percentage"})}
                  className={cn(
                    "py-4 rounded-xl font-black flex items-center justify-center gap-2 transition-all",
                    config.commissionType === "percentage" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-secondary"
                  )}
                >
                  <Percent className="w-5 h-5" /> Percentage
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-2">
                  <label className="text-sm font-bold ml-1">Commission Value</label>
                  <div className="relative">
                    <div className="absolute left-4 top-3.5 font-black text-muted-foreground">
                      {config.commissionType === "fixed" ? "₹" : "%"}
                    </div>
                    <input 
                      type="number" 
                      value={config.commissionValue}
                      onChange={(e) => setConfig({...config, commissionValue: Number(e.target.value)})}
                      className="w-full pl-10 pr-4 py-3.5 bg-background border border-border rounded-2xl outline-none font-black text-lg"
                    />
                  </div>
                </div>
                
                <div className="flex items-center gap-4 p-6 bg-primary/5 rounded-3xl border border-primary/10">
                  <Info className="w-8 h-8 text-primary shrink-0" />
                  <p className="text-xs font-bold text-primary leading-relaxed uppercase tracking-tight">
                    This commission will ONLY be credited if the referred customer earns at least 1 Lucky Draw coupon.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Lucky Draw Trigger Config */}
          <div className="bg-secondary/30 rounded-[3rem] border border-border p-10">
            <h2 className="text-2xl font-black mb-8 flex items-center gap-3">
              <Zap className="w-7 h-7 text-primary" />
              Lucky Draw Rules
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-2">
                <label className="text-sm font-bold ml-1">Trigger Threshold (Coupons)</label>
                <input 
                  type="number" 
                  value={config.drawTriggerCount}
                  onChange={(e) => setConfig({...config, drawTriggerCount: Number(e.target.value)})}
                  className="w-full px-4 py-3.5 bg-background border border-border rounded-2xl outline-none font-black text-lg"
                />
                <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest ml-1">Draw triggers at this many coupons issued</p>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold ml-1">Spend per Coupon (₹)</label>
                <input 
                  type="number" 
                  value={config.minSpendForCoupon}
                  onChange={(e) => setConfig({...config, minSpendForCoupon: Number(e.target.value)})}
                  className="w-full px-4 py-3.5 bg-background border border-border rounded-2xl outline-none font-black text-lg"
                />
                <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest ml-1">Amount spent on eligible items to earn 1 coupon</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

import { cn } from "@/lib/utils";
