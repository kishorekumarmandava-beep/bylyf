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
import { collection, query, where, getDocs, addDoc, serverTimestamp } from "firebase/firestore";
import { cn } from "@/lib/utils";

export default function ReferralAgentDashboard() {
  const { user, profile } = useAuth();
  const router = useRouter();
  const [commissions, setCommissions] = useState<any[]>([]);
  const [withdrawals, setWithdrawals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [upiId, setUpiId] = useState("");
  const [withdrawing, setWithdrawing] = useState(false);

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
      const q = query(collection(db, "commissions"), where("agentUid", "==", user.uid));
      const snap = await getDocs(q);
      setCommissions(snap.docs.map(d => ({ id: d.id, ...d.data() })));

      const wq = query(collection(db, "withdrawals"), where("agentUid", "==", user.uid));
      const wSnap = await getDocs(wq);
      setWithdrawals(wSnap.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const totalEarnings = commissions.reduce((s, c) => s + (c.amount || 0), 0);
  const totalSalesValue = commissions.reduce((s, c) => s + (c.saleAmount || 0), 0);
  const totalCoupons = commissions.reduce((s, c) => s + (c.couponsEarned || 0), 0);
  const totalReferrals = commissions.length;
  
  const totalWithdrawn = withdrawals.filter(w => w.status !== "rejected").reduce((s, w) => s + (w.amount || 0), 0);
  const availableBalance = totalEarnings - totalWithdrawn;

  const copyLink = () => {
    navigator.clipboard.writeText(referralLink);
    toast.success("Referral link copied!");
  };

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
              Earn ₹500 commission for every Lucky Draw coupon earned by your referrals.
            </p>
          </div>
          <button
            onClick={() => {
              if (availableBalance <= 0) {
                toast.error("You do not have any available balance to withdraw.");
                return;
              }
              setShowWithdrawModal(true);
            }}
            className="px-6 py-3 bg-blue-600 text-white rounded-2xl font-bold flex items-center gap-2 hover:scale-105 transition-all shadow-lg shadow-blue-500/20"
          >
            <IndianRupee className="w-4 h-4" />
            Withdraw ₹{availableBalance.toLocaleString("en-IN")}
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
          {[
            { label: "Total Referrals", value: totalReferrals, icon: Users, color: "text-blue-600" },
            { label: "Total Sales", value: `₹${totalSalesValue.toLocaleString("en-IN")}`, icon: ShoppingBag, color: "text-violet-600" },
            { label: "Coupons Earned", value: totalCoupons, icon: Award, color: "text-amber-500" },
            { label: "Comm. Earned", value: `₹${totalEarnings.toLocaleString("en-IN")}`, icon: IndianRupee, color: "text-primary" },
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
                <p className="text-blue-100 text-sm mb-6">Share this link. Earn ₹500 for every coupon-eligible item bought through it.</p>
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
                <TrendingUp className="w-5 h-5 text-primary" />
                Recent Commissions
              </h3>
              {loading ? (
                <div className="py-12 text-center font-black animate-pulse">Loading...</div>
              ) : commissions.length === 0 ? (
                <div className="py-12 text-center text-muted-foreground italic text-sm">
                  No commissions earned yet. Share your link to start earning!
                </div>
              ) : (
                <div className="space-y-3">
                  {commissions.map(c => (
                    <div key={c.id} className="p-5 bg-background rounded-[2rem] border border-border">
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <div className="font-black text-sm uppercase font-mono text-primary flex items-center gap-2">
                            Order #{c.orderId?.slice(0, 8) || "N/A"}
                            {c.status === "sale_recorded" && (
                              <span className="bg-secondary px-2 py-0.5 rounded text-[8px] tracking-widest">NO COMM.</span>
                            )}
                          </div>
                          <div className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest mt-1">
                            {c.customerName || "Customer"} • {c.createdAt?.toDate?.().toLocaleDateString() || "Date N/A"}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className={cn(
                            "font-black text-lg",
                            c.amount > 0 ? "text-green-600" : "text-muted-foreground"
                          )}>
                            {c.amount > 0 ? `+₹${c.amount.toLocaleString("en-IN")}` : "₹0"}
                          </div>
                          <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Commission</div>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4 pt-4 border-t border-border/50">
                        <div>
                          <div className="text-[9px] font-black text-muted-foreground uppercase tracking-widest mb-1">Sale Amount</div>
                          <div className="font-bold text-sm">₹{c.saleAmount?.toLocaleString("en-IN") || "0"}</div>
                        </div>
                        <div className="text-right">
                          <div className="text-[9px] font-black text-muted-foreground uppercase tracking-widest mb-1">Coupons</div>
                          <div className="font-bold text-sm">{c.couponsEarned || 0} Earned</div>
                        </div>
                      </div>

                      {c.couponIds && c.couponIds.length > 0 && (
                        <div className="mt-4 p-3 bg-secondary/50 rounded-xl">
                          <div className="text-[9px] font-black text-muted-foreground uppercase tracking-widest mb-2">Coupon IDs</div>
                          <div className="flex flex-wrap gap-2">
                            {c.couponIds.map((id: string) => (
                              <span key={id} className="text-[10px] font-mono font-bold bg-background px-2 py-1 rounded border border-border">
                                {id}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right: Milestones + Info */}
          <div className="lg:col-span-4 space-y-8">



            {/* Commission Breakdown */}
            <div className="bg-secondary/30 border border-border rounded-[3rem] p-8">
              <h3 className="text-lg font-black mb-6 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-primary" />
                Earnings Breakdown
              </h3>
              <div className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Commission Type</span>
                  <span className="font-black text-xs uppercase tracking-widest">Fixed (₹500)</span>
                </div>
                <div className="flex justify-between pt-4 border-t border-border">
                  <span className="text-sm font-bold">Total Earnings</span>
                  <span className="font-black text-green-600">₹{totalEarnings.toLocaleString("en-IN")}</span>
                </div>
                {totalWithdrawn > 0 && (
                  <div className="flex justify-between pt-4 border-t border-border">
                    <span className="text-sm font-bold">Total Withdrawn/Pending</span>
                    <span className="font-black text-red-500">-₹{totalWithdrawn.toLocaleString("en-IN")}</span>
                  </div>
                )}
                <div className="flex justify-between pt-4 border-t border-border/80">
                  <span className="text-sm font-bold text-primary uppercase tracking-widest">Available Balance</span>
                  <span className="font-black text-primary text-xl">₹{availableBalance.toLocaleString("en-IN")}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {showWithdrawModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-background border border-border rounded-[3rem] shadow-3xl w-full max-w-md overflow-hidden flex flex-col p-8">
            <h3 className="text-2xl font-black mb-2">Request Withdrawal</h3>
            <p className="text-muted-foreground text-sm mb-6">You are requesting to withdraw your available balance of <strong className="text-primary">₹{availableBalance.toLocaleString("en-IN")}</strong>.</p>
            
            <div className="space-y-4 mb-8">
              <div>
                <label className="text-xs font-black uppercase tracking-widest text-muted-foreground mb-2 block">Your UPI ID</label>
                <input 
                  type="text" 
                  value={upiId}
                  onChange={(e) => setUpiId(e.target.value)}
                  placeholder="e.g. phone@upi or name@bank"
                  className="w-full px-4 py-3 bg-secondary/50 border border-border rounded-xl font-bold outline-none focus:ring-2 focus:ring-primary transition-all"
                />
              </div>
            </div>

            <div className="flex gap-4">
              <button 
                onClick={() => setShowWithdrawModal(false)}
                disabled={withdrawing}
                className="flex-1 py-3 bg-secondary text-foreground rounded-2xl font-bold hover:bg-secondary/80 transition-all disabled:opacity-50"
              >
                Cancel
              </button>
              <button 
                disabled={withdrawing || !upiId.trim()}
                onClick={async () => {
                  setWithdrawing(true);
                  try {
                    await addDoc(collection(db, "withdrawals"), {
                      agentUid: user?.uid,
                      agentName: profile?.displayName || "Unknown Agent",
                      agentRole: "agent",
                      upiId: upiId.trim(),
                      amount: availableBalance,
                      status: "pending",
                      createdAt: serverTimestamp(),
                    });
                    toast.success("Withdrawal requested successfully!");
                    setShowWithdrawModal(false);
                    setUpiId("");
                    fetchData(); // refresh balances
                  } catch (err: any) {
                    toast.error(err.message || "Failed to request withdrawal.");
                  } finally {
                    setWithdrawing(false);
                  }
                }}
                className="flex-1 py-3 bg-blue-600 text-white rounded-2xl font-black shadow-lg shadow-blue-500/20 hover:scale-105 active:scale-95 transition-all disabled:opacity-50 disabled:hover:scale-100"
              >
                {withdrawing ? "Processing..." : "Confirm"}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
