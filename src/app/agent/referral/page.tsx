"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import Navbar from "@/components/layout/Navbar";
import Link from "next/link";
import {
  Share2, Copy, TrendingUp, Users, IndianRupee,
  ArrowRight, Award, CheckCircle2, Clock, Zap,
  ShoppingBag, ChevronRight
} from "lucide-react";
import toast from "react-hot-toast";
import { db } from "@/lib/firebase";
import { collection, query, where, getDocs } from "firebase/firestore";

export default function ReferralAgentDashboard() {
  const { user, profile } = useAuth();
  const router = useRouter();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const referralCode = profile?.referralCode || user?.uid?.slice(0, 8).toUpperCase() || "--------";
  const referralLink = `https://bylyf--bylyf-store-2026.asia-southeast1.hosted.app?ref=${referralCode}`;

  useEffect(() => {
    if (!profile) return;
    if (profile.role !== "agent") {
      router.push("/agent/dashboard");
      return;
    }
    fetchData();
  }, [profile]);

  const fetchData = async () => {
    if (!user) return;
    try {
      const q = query(collection(db, "orders"), where("referralCode", "==", referralCode));
      const snap = await getDocs(q);
      setOrders(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const totalSales = orders.reduce((s, o) => s + (o.total || 0), 0);
  const commission = Math.floor(totalSales * 0.05); // 5% commission
  const copyLink = () => {
    navigator.clipboard.writeText(referralLink);
    toast.success("Referral link copied!");
  };

  const MILESTONE_STEPS = [
    { sales: 10, label: "Bronze", reward: "₹500 Bonus" },
    { sales: 25, label: "Silver", reward: "₹1,500 Bonus" },
    { sales: 50, label: "Gold", reward: "₹5,000 Bonus + Gift" },
    { sales: 100, label: "Platinum", reward: "₹15,000 + Exclusive Perks" },
  ];
  const nextMilestone = MILESTONE_STEPS.find(m => orders.length < m.sales) ?? MILESTONE_STEPS[MILESTONE_STEPS.length - 1];
  const milestoneProgress = Math.min((orders.length / nextMilestone.sales) * 100, 100);

  return (
    <main className="min-h-screen bg-background">
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 py-12">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-12 gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-500/10 text-blue-600 rounded-full text-xs font-black uppercase tracking-widest mb-4">
              <Share2 className="w-4 h-4" />
              Referral Agent Portal
            </div>
            <h1 className="text-4xl font-black tracking-tight">
              Welcome, {profile?.displayName?.split(" ")[0]} 👋
            </h1>
            <p className="text-muted-foreground mt-2">
              Earn 5% commission on every order placed through your referral link.
            </p>
          </div>
          <button
            onClick={() => toast("Withdrawal requests coming soon!")}
            className="px-6 py-3 bg-blue-600 text-white rounded-2xl font-bold flex items-center gap-2 hover:scale-105 transition-all shadow-lg shadow-blue-500/20"
          >
            <IndianRupee className="w-4 h-4" />
            Withdraw Earnings
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
          {[
            { label: "Total Referrals", value: orders.length, icon: Users, color: "text-blue-600" },
            { label: "Total Sales", value: `₹${totalSales.toLocaleString("en-IN")}`, icon: ShoppingBag, color: "text-green-600" },
            { label: "Commission Earned", value: `₹${commission.toLocaleString("en-IN")}`, icon: IndianRupee, color: "text-primary" },
            { label: "Pending Payout", value: `₹${commission.toLocaleString("en-IN")}`, icon: Clock, color: "text-orange-500" },
          ].map((stat, i) => (
            <div key={i} className="bg-secondary/30 border border-border rounded-[2rem] p-6">
              <stat.icon className={`w-6 h-6 mb-3 ${stat.color}`} />
              <div className="text-2xl font-black">{stat.value}</div>
              <div className="text-xs font-bold text-muted-foreground uppercase tracking-widest mt-1">{stat.label}</div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left: Main Content */}
          <div className="lg:col-span-8 space-y-8">

            {/* Referral Link Card */}
            <div className="bg-gradient-to-br from-blue-600 to-blue-700 text-white rounded-[3rem] p-10 relative overflow-hidden shadow-2xl shadow-blue-500/30">
              <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl" />
              <div className="relative z-10">
                <h3 className="text-2xl font-black mb-2">Your Referral Link</h3>
                <p className="text-blue-100 text-sm mb-6">Share this link. Earn 5% on every order placed through it.</p>
                <div className="flex gap-3">
                  <input
                    readOnly
                    value={referralLink}
                    className="flex-1 bg-white/10 border border-white/20 rounded-2xl px-4 py-3 text-sm font-bold text-white placeholder:text-white/50 outline-none"
                  />
                  <button
                    onClick={copyLink}
                    className="px-5 py-3 bg-white text-blue-600 rounded-2xl font-black text-xs flex items-center gap-2 hover:scale-105 transition-all"
                  >
                    <Copy className="w-4 h-4" />
                    Copy
                  </button>
                </div>
                <div className="flex gap-3 mt-4">
                  {[
                    { label: "Share on WhatsApp", href: `https://wa.me/?text=Shop%20on%20BYLYF%20and%20get%20the%20best%20deals!%20Use%20my%20link:%20${encodeURIComponent(referralLink)}` },
                    { label: "Share on Telegram", href: `https://t.me/share/url?url=${encodeURIComponent(referralLink)}&text=Shop+on+BYLYF!` },
                  ].map(s => (
                    <a
                      key={s.label}
                      href={s.href}
                      target="_blank"
                      rel="noreferrer"
                      className="px-4 py-2 bg-white/10 border border-white/20 rounded-xl text-xs font-bold hover:bg-white/20 transition-colors flex items-center gap-2"
                    >
                      <Share2 className="w-3 h-3" />
                      {s.label}
                    </a>
                  ))}
                </div>
              </div>
            </div>

            {/* Referral Code */}
            <div className="bg-secondary/30 border border-border rounded-[2.5rem] p-8">
              <h3 className="text-xl font-black mb-2">Referral Code</h3>
              <p className="text-muted-foreground text-sm mb-6">Customers can also manually enter this code at checkout.</p>
              <div className="flex items-center gap-4">
                <div className="flex-1 bg-background border-2 border-primary/30 rounded-2xl px-6 py-4 font-mono font-black text-2xl text-primary tracking-widest text-center">
                  {referralCode}
                </div>
                <button
                  onClick={() => { navigator.clipboard.writeText(referralCode); toast.success("Code copied!"); }}
                  className="p-4 bg-primary text-primary-foreground rounded-2xl hover:scale-105 transition-all"
                >
                  <Copy className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Recent Referral Orders */}
            <div className="bg-secondary/30 border border-border rounded-[2.5rem] p-8">
              <h3 className="text-xl font-black mb-6 flex items-center gap-2">
                <ShoppingBag className="w-5 h-5 text-primary" />
                Referral Orders
              </h3>
              {loading ? (
                <div className="py-12 text-center font-black animate-pulse">Loading...</div>
              ) : orders.length === 0 ? (
                <div className="py-12 text-center text-muted-foreground italic text-sm">
                  No orders via your referral link yet. Share it to start earning!
                </div>
              ) : (
                <div className="space-y-3">
                  {orders.map(o => (
                    <div key={o.id} className="flex items-center justify-between p-4 bg-background rounded-2xl border border-border">
                      <div>
                        <div className="font-bold text-sm">{o.shippingAddress?.fullName || "Customer"}</div>
                        <div className="text-xs text-muted-foreground">{o.createdAt?.toDate?.().toLocaleDateString()}</div>
                      </div>
                      <div className="text-right">
                        <div className="font-black">₹{o.total?.toLocaleString("en-IN")}</div>
                        <div className="text-xs text-green-600 font-bold">+₹{Math.floor(o.total * 0.05)} comm.</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right: Milestones + Info */}
          <div className="lg:col-span-4 space-y-8">

            {/* Milestone Progress */}
            <div className="bg-secondary/30 border border-border rounded-[3rem] p-8">
              <h3 className="text-lg font-black mb-2 flex items-center gap-2">
                <Award className="w-5 h-5 text-primary" />
                Milestone Progress
              </h3>
              <p className="text-xs text-muted-foreground mb-6">Next: <strong>{nextMilestone.label}</strong> — {nextMilestone.reward}</p>
              <div className="flex justify-between text-xs font-bold mb-2">
                <span>{orders.length} orders</span>
                <span>{nextMilestone.sales} needed</span>
              </div>
              <div className="h-3 bg-secondary rounded-full overflow-hidden">
                <div
                  className="h-full bg-blue-500 rounded-full transition-all duration-1000"
                  style={{ width: `${milestoneProgress}%` }}
                />
              </div>
              <div className="mt-6 space-y-3">
                {MILESTONE_STEPS.map((m, i) => (
                  <div key={i} className={`flex items-center justify-between p-3 rounded-xl text-xs font-bold ${orders.length >= m.sales ? "bg-green-500/10 text-green-600" : "bg-secondary text-muted-foreground"}`}>
                    <span className="flex items-center gap-2">
                      {orders.length >= m.sales ? <CheckCircle2 className="w-3 h-3" /> : <div className="w-3 h-3 rounded-full border border-current" />}
                      {m.label} ({m.sales} orders)
                    </span>
                    <span>{m.reward}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Commission Breakdown */}
            <div className="bg-secondary/30 border border-border rounded-[3rem] p-8">
              <h3 className="text-lg font-black mb-6 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-primary" />
                Earnings
              </h3>
              <div className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Total Sales Value</span>
                  <span className="font-black">₹{totalSales.toLocaleString("en-IN")}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Commission (5%)</span>
                  <span className="font-black text-green-600">₹{commission.toLocaleString("en-IN")}</span>
                </div>
                <div className="flex justify-between pt-4 border-t border-border">
                  <span className="text-sm font-bold">Pending Payout</span>
                  <span className="font-black text-primary">₹{commission.toLocaleString("en-IN")}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
