"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import Navbar from "@/components/layout/Navbar";
import {
  Ticket, Printer, Plus, IndianRupee, TrendingUp,
  CheckCircle2, Package, BarChart3, Download, RefreshCw
} from "lucide-react";
import toast from "react-hot-toast";
import { db } from "@/lib/firebase";
import {
  collection, query, where, getDocs,
  addDoc, serverTimestamp
} from "firebase/firestore";
import jsPDF from "jspdf";
import { cn } from "@/lib/utils";

export default function StorefrontAgentDashboard() {
  const { user, profile } = useAuth();
  const router = useRouter();
  const [coupons, setCoupons] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    if (!profile) return;
    if (profile.role !== "storefront_agent") {
      router.push("/agent/dashboard");
      return;
    }
    fetchCoupons();
  }, [profile]);

  const fetchCoupons = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const q = query(collection(db, "coupons"), where("createdBy", "==", user.uid));
      const snap = await getDocs(q);
      setCoupons(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch (e) {
      console.error(e);
      toast.error("Failed to load coupons.");
    } finally {
      setLoading(false);
    }
  };

  const activeCoupons = coupons.filter(c => c.status === "active");
  const redeemedCoupons = coupons.filter(c => c.status === "redeemed");
  const redemptionsInCycle = redeemedCoupons.length % 6;
  const fullCycles = Math.floor(redeemedCoupons.length / 6);
  const totalEarned = fullCycles * 3000;
  const progressPct = (redemptionsInCycle / 6) * 100;

  const generateBatch = async (count: number = 10) => {
    if (!user) return;
    setGenerating(true);
    try {
      const batch: Promise<any>[] = [];
      for (let i = 0; i < count; i++) {
        const code = `BY-SF-${user.uid.slice(0, 4).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
        batch.push(addDoc(collection(db, "coupons"), {
          code,
          type: "storefront_discount",
          value: 500,
          createdBy: user.uid,
          agentName: profile?.displayName,
          status: "active",
          createdAt: serverTimestamp(),
          redeemedBy: null,
          redeemedAt: null,
        }));
      }
      await Promise.all(batch);
      toast.success(`✅ Generated ${count} new coupons!`);
      fetchCoupons();
    } catch (err: any) {
      toast.error(err.message || "Failed to generate coupons.");
    } finally {
      setGenerating(false);
    }
  };

  const printPDF = () => {
    if (activeCoupons.length === 0) {
      toast.error("No active coupons to print.");
      return;
    }
    const pdf = new jsPDF();
    pdf.setFillColor(0, 0, 0);
    pdf.rect(0, 0, 210, 15, "F");
    pdf.setTextColor(255, 255, 255);
    pdf.setFontSize(14);
    pdf.setFont("helvetica", "bold");
    pdf.text("BYLYF STOREFRONT COUPONS", 105, 10, { align: "center" });

    pdf.setTextColor(0, 0, 0);
    pdf.setFontSize(10);
    pdf.setFont("helvetica", "normal");
    pdf.text(`Agent: ${profile?.displayName} | Each coupon: ₹500 OFF | Valid once per customer`, 10, 22);
    pdf.text(`Generated: ${new Date().toLocaleDateString("en-IN")}`, 10, 28);
    pdf.line(10, 31, 200, 31);

    let y = 40;
    activeCoupons.forEach((coupon) => {
      if (y > 260) { pdf.addPage(); y = 20; }
      pdf.setDrawColor(200, 200, 200);
      pdf.roundedRect(10, y, 190, 28, 3, 3);

      pdf.setFontSize(13);
      pdf.setFont("helvetica", "bold");
      pdf.setTextColor(0, 0, 0);
      pdf.text(coupon.code, 18, y + 12);

      pdf.setFontSize(8);
      pdf.setFont("helvetica", "normal");
      pdf.setTextColor(100, 100, 100);
      pdf.text("₹500 OFF on BYLYF.com | Show this coupon at checkout", 18, y + 20);

      pdf.setFontSize(11);
      pdf.setFont("helvetica", "bold");
      pdf.setTextColor(0, 0, 0);
      pdf.text("₹500 OFF", 185, y + 12, { align: "right" });

      y += 36;
    });

    pdf.save(`BYLYF-Coupons-${profile?.displayName?.replace(/\s/g, "_")}.pdf`);
    toast.success("PDF downloaded!");
  };

  return (
    <main className="min-h-screen bg-background">
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 py-12">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-12 gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-violet-500/10 text-violet-600 rounded-full text-xs font-black uppercase tracking-widest mb-4">
              <Package className="w-4 h-4" />
              Storefront Agent Portal
            </div>
            <h1 className="text-4xl font-black tracking-tight">
              Welcome, {profile?.displayName?.split(" ")[0]} 👋
            </h1>
            <p className="text-muted-foreground mt-2">
              Distribute ₹500 coupons to customers. Earn ₹3,000 for every 6 redemptions.
            </p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => generateBatch(10)}
              disabled={generating}
              className="px-6 py-3 bg-violet-600 text-white rounded-2xl font-bold flex items-center gap-2 hover:scale-105 transition-all shadow-lg shadow-violet-500/20 disabled:opacity-50"
            >
              <Plus className="w-4 h-4" />
              {generating ? "Generating..." : "Generate 10 Coupons"}
            </button>
            <button
              onClick={printPDF}
              className="px-6 py-3 bg-secondary border border-border rounded-2xl font-bold flex items-center gap-2 hover:bg-secondary/80 transition-all"
            >
              <Printer className="w-4 h-4" />
              Print PDF
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
          {[
            { label: "Total Coupons", value: coupons.length, icon: Ticket, color: "text-violet-600" },
            { label: "Active", value: activeCoupons.length, icon: CheckCircle2, color: "text-green-600" },
            { label: "Redeemed", value: redeemedCoupons.length, icon: BarChart3, color: "text-primary" },
            { label: "Total Earned", value: `₹${totalEarned.toLocaleString("en-IN")}`, icon: IndianRupee, color: "text-orange-500" },
          ].map((stat, i) => (
            <div key={i} className="bg-secondary/30 border border-border rounded-[2rem] p-6">
              <stat.icon className={`w-6 h-6 mb-3 ${stat.color}`} />
              <div className="text-2xl font-black">{stat.value}</div>
              <div className="text-xs font-bold text-muted-foreground uppercase tracking-widest mt-1">{stat.label}</div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left */}
          <div className="lg:col-span-8 space-y-8">

            {/* Commission Milestone */}
            <div className="bg-gradient-to-br from-violet-600 to-violet-800 text-white rounded-[3rem] p-10 relative overflow-hidden shadow-2xl shadow-violet-500/30">
              <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl" />
              <div className="relative z-10">
                <h3 className="text-2xl font-black mb-6">Commission Cycle</h3>
                <div className="flex justify-between items-end mb-4">
                  <div>
                    <div className="text-5xl font-black">{redemptionsInCycle}<span className="text-2xl opacity-60"> / 6</span></div>
                    <div className="text-xs font-bold uppercase tracking-widest opacity-60 mt-1">Redemptions in current cycle</div>
                  </div>
                  <div className="text-right">
                    <div className="text-3xl font-black">₹3,000</div>
                    <div className="text-xs font-bold uppercase tracking-widest opacity-60">Payout per cycle</div>
                  </div>
                </div>
                <div className="h-4 bg-white/10 rounded-full overflow-hidden border border-white/10">
                  <div
                    className="h-full bg-white rounded-full transition-all duration-1000"
                    style={{ width: `${progressPct}%` }}
                  />
                </div>
                <div className="flex justify-between text-xs opacity-60 mt-2">
                  <span>{redemptionsInCycle} redeemed</span>
                  <span>{6 - redemptionsInCycle} more to earn ₹3,000</span>
                </div>
                <div className="mt-6 flex gap-6">
                  <div>
                    <div className="text-xl font-black">{fullCycles}</div>
                    <div className="text-xs opacity-60 uppercase tracking-widest">Cycles Completed</div>
                  </div>
                  <div>
                    <div className="text-xl font-black">₹{totalEarned.toLocaleString("en-IN")}</div>
                    <div className="text-xs opacity-60 uppercase tracking-widest">Total Earned</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Coupon Inventory */}
            <div className="bg-secondary/30 border border-border rounded-[3rem] p-8">
              <div className="flex justify-between items-center mb-8">
                <h3 className="text-xl font-black flex items-center gap-2">
                  <Ticket className="w-5 h-5 text-violet-600" />
                  Coupon Inventory
                  <span className="text-sm font-bold text-muted-foreground ml-2">({activeCoupons.length} active)</span>
                </h3>
                <button
                  onClick={fetchCoupons}
                  className="p-2 hover:bg-secondary rounded-xl transition-colors"
                  title="Refresh"
                >
                  <RefreshCw className="w-4 h-4 text-muted-foreground" />
                </button>
              </div>

              {loading ? (
                <div className="py-12 text-center font-black animate-pulse">Loading coupons...</div>
              ) : coupons.length === 0 ? (
                <div className="py-12 text-center text-muted-foreground italic text-sm">
                  No coupons yet. Click &quot;Generate 10 Coupons&quot; to get started.
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  {coupons.map((coupon) => (
                    <div
                      key={coupon.id}
                      className={cn(
                        "p-4 rounded-2xl border flex flex-col items-center justify-center text-center gap-2",
                        coupon.status === "active"
                          ? "bg-background border-violet-500/20"
                          : "bg-secondary/50 border-border opacity-50"
                      )}
                    >
                      <Ticket className={cn("w-4 h-4", coupon.status === "active" ? "text-violet-600" : "text-muted-foreground")} />
                      <div className="text-xs font-black font-mono text-primary">{coupon.code}</div>
                      <div className={cn(
                        "text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full",
                        coupon.status === "active" ? "bg-green-500/10 text-green-600" : "bg-muted text-muted-foreground"
                      )}>
                        {coupon.status}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right */}
          <div className="lg:col-span-4 space-y-8">

            {/* How It Works */}
            <div className="bg-secondary/30 border border-border rounded-[3rem] p-8">
              <h3 className="text-lg font-black mb-6 uppercase tracking-widest">How It Works</h3>
              <ol className="space-y-5">
                {[
                  { step: "1", text: "Generate a batch of ₹500 coupons." },
                  { step: "2", text: "Print the PDF and distribute to local customers." },
                  { step: "3", text: "Each coupon gives ₹500 off on BYLYF." },
                  { step: "4", text: "Once 6 coupons are redeemed, you earn ₹3,000." },
                  { step: "5", text: "Cycle resets — keep distributing to earn more!" },
                ].map(item => (
                  <li key={item.step} className="flex items-start gap-4">
                    <div className="w-7 h-7 rounded-full bg-violet-600 text-white font-black text-xs flex items-center justify-center shrink-0">
                      {item.step}
                    </div>
                    <p className="text-sm font-medium text-muted-foreground pt-1">{item.text}</p>
                  </li>
                ))}
              </ol>
            </div>

            {/* Earnings Breakdown */}
            <div className="bg-secondary/30 border border-border rounded-[3rem] p-8">
              <h3 className="text-lg font-black mb-6 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-primary" />
                Earnings
              </h3>
              <div className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Completed Cycles</span>
                  <span className="font-black">{fullCycles}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Rate Per Cycle</span>
                  <span className="font-black">₹3,000</span>
                </div>
                <div className="flex justify-between pt-4 border-t border-border">
                  <span className="text-sm font-bold">Total Earned</span>
                  <span className="font-black text-violet-600">₹{totalEarned.toLocaleString("en-IN")}</span>
                </div>
                <button
                  onClick={() => toast("Withdrawal coming soon!")}
                  className="w-full py-3 bg-violet-600 text-white rounded-2xl font-black text-sm hover:scale-105 transition-all mt-2"
                >
                  Request Withdrawal
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
