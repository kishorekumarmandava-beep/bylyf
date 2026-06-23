"use client";

import React, { useState, useEffect } from "react";
import Navbar from "@/components/layout/Navbar";
import { 
  Zap, 
  Users, 
  Trophy, 
  ShieldCheck, 
  Ticket, 
  ArrowRight,
  TrendingUp,
  Info
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

import { db } from "@/lib/firebase";
import { collection, query, orderBy, limit, onSnapshot, getDoc, doc, getDocs, where } from "firebase/firestore";

export default function LuckyDrawPage() {
  const [totalEntries, setTotalEntries] = useState(0);
  const [targetEntries, setTargetEntries] = useState(1000);
  const [loading, setLoading] = useState(true);
  const [recentEntries, setRecentEntries] = useState<any[]>([]);

  const [activeCampaign, setActiveCampaign] = useState<any>(null);
  const [upcomingCampaigns, setUpcomingCampaigns] = useState<any[]>([]);

  useEffect(() => {
    // 1. Fetch Campaigns
    const qCamps = query(collection(db, "campaigns"));
    const unsubCamps = onSnapshot(qCamps, (snapshot) => {
      const camps = snapshot.docs.map(d => ({id: d.id, ...d.data()})) as any[];
      const active = camps.find(c => c.status === "active" || c.status === "drawing");
      const upcoming = camps.filter(c => c.status === "upcoming").sort((a:any, b:any) => a.createdAt?.toMillis() - b.createdAt?.toMillis());
      
      setActiveCampaign(active || null);
      setUpcomingCampaigns(upcoming);
      
      if (active) {
        setTargetEntries(active.targetCoupons);
        setTotalEntries(active.currentCoupons);
      }
    });

    // 2. Listen for recent entries of active campaign
    const qEntries = query(
      collection(db, "lucky_draw_entries"),
      orderBy("createdAt", "desc"),
      limit(10)
    );

    const unsubscribe = onSnapshot(qEntries, async (snapshot) => {
      // Filter client side to active campaign or just show latest 10 globally.
      // Doing it globally is fine for "live feed", but let's filter if we have active.
      const entries = snapshot.docs.map((docSnap) => {
        const data = docSnap.data();
        let maskedName = data.maskedName || "Participant";
        return {
          id: data.couponId,
          campaignId: data.campaignId,
          name: maskedName,
          location: "Verified Purchase",
          time: data.createdAt?.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) || "Just now"
        };
      });
      
      setRecentEntries(entries);
      setLoading(false);
    });

    return () => {
      unsubCamps();
      unsubscribe();
    };
  }, []);

  const progress = (totalEntries / targetEntries) * 100;

  return (
    <main className="min-h-screen bg-background">
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 py-12 lg:py-20">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
          
          {/* Left: Progress & Prize (The "Hero" of the page) */}
          <div className="lg:col-span-7 space-y-8">
            <div className="bg-primary text-primary-foreground rounded-[3rem] p-10 lg:p-16 relative overflow-hidden shadow-2xl shadow-primary/20">
              <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl"></div>
              
              <div className="relative z-10">
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 rounded-full text-xs font-black uppercase tracking-widest mb-8 border border-white/10">
                  <Zap className="w-4 h-4 fill-current" />
                  Active Bumper Draw
                </div>
                
                <h1 className="text-5xl lg:text-7xl font-black tracking-tighter mb-8 leading-none">
                  {activeCampaign ? activeCampaign.title : "Lucky Draw"}
                </h1>

                <div className="space-y-6 mb-12">
                  <div className="flex justify-between items-end">
                    <div>
                      <div className="text-4xl font-black tracking-tight">{totalEntries}</div>
                      <div className="text-xs font-bold uppercase tracking-widest opacity-60">Coupons Issued</div>
                    </div>
                    <div className="text-right">
                      <div className="text-xl font-black tracking-tight">{targetEntries}</div>
                      <div className="text-xs font-bold uppercase tracking-widest opacity-60">Target to Draw</div>
                    </div>
                  </div>
                  
                  <div className="h-4 bg-white/10 rounded-full overflow-hidden p-1 border border-white/10">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${progress}%` }}
                      transition={{ duration: 1.5, ease: "easeOut" }}
                      className="h-full bg-white rounded-full relative"
                    >
                      <div className="absolute inset-0 bg-[linear-gradient(90deg,transparent,rgba(255,255,255,0.4),transparent)] animate-[shimmer_2s_infinite]"></div>
                    </motion.div>
                  </div>
                  
                  <p className="text-lg font-medium opacity-80 italic">
                    The draw will trigger automatically as soon as we hit {targetEntries} coupons!
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="p-6 bg-white/5 rounded-3xl border border-white/10">
                    <Trophy className="w-8 h-8 mb-4 opacity-50" />
                    <div className="text-sm font-bold opacity-60 mb-1 uppercase tracking-widest">Grand Prize</div>
                    <div className="text-xl font-black">{activeCampaign?.prizeValue ? `₹${activeCampaign.prizeValue.toLocaleString()}` : "Worth ₹1000000"}</div>
                  </div>
                  <div className="p-6 bg-white/5 rounded-3xl border border-white/10">
                    <ShieldCheck className="w-8 h-8 mb-4 opacity-50" />
                    <div className="text-sm font-bold opacity-60 mb-1 uppercase tracking-widest">Auditable By</div>
                    <div className="text-xl font-black">Third-Party</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-secondary/30 rounded-[3rem] border border-border p-10">
              <h3 className="text-2xl font-black mb-6 flex items-center gap-3">
                <Info className="w-6 h-6 text-primary" />
                Draw Rules & Details
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-4">
                  <div className="w-10 h-10 bg-background rounded-xl flex items-center justify-center font-black border border-border">1</div>
                  <p className="font-bold text-muted-foreground">Look for products with the <Zap className="w-3 h-3 inline text-primary" /> DRAW ELIGIBLE badge to participate.</p>
                </div>
                <div className="space-y-4">
                  <div className="w-10 h-10 bg-background rounded-xl flex items-center justify-center font-black border border-border">2</div>
                  <p className="font-bold text-muted-foreground">The target to draw is linked to the active campaign. It triggers automatically when the goal of {targetEntries} is met.</p>
                </div>
                <div className="space-y-4">
                  <div className="w-10 h-10 bg-background rounded-xl flex items-center justify-center font-black border border-border">3</div>
                  <p className="font-bold text-muted-foreground">Winners will be announced on our platform and contacted directly.</p>
                </div>
                <div className="space-y-4">
                  <div className="w-10 h-10 bg-background rounded-xl flex items-center justify-center font-black border border-border">4</div>
                  <p className="font-bold text-muted-foreground">All purchases are final. Read full terms and conditions for eligibility.</p>
                </div>
              </div>
            </div>

            {upcomingCampaigns.length > 0 && (
              <div className="bg-background rounded-[3rem] border border-border p-10">
                <h3 className="text-xl font-black mb-6 uppercase tracking-widest text-muted-foreground">Up Next</h3>
                <div className="space-y-4">
                  {upcomingCampaigns.map(camp => (
                    <div key={camp.id} className="p-6 bg-secondary/30 rounded-2xl border border-border flex justify-between items-center">
                      <div>
                        <div className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-1">{camp.campaignId}</div>
                        <h4 className="font-black text-lg">{camp.title}</h4>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-bold text-primary">{camp.prizeDescription}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right: Real-time Participant Feed */}
          <div className="lg:col-span-5">
            <div className="bg-background rounded-[3rem] border border-border p-8 shadow-xl sticky top-32">
              <div className="flex justify-between items-center mb-8">
                <h3 className="text-2xl font-black flex items-center gap-3">
                  <Users className="w-6 h-6 text-primary" />
                  Live Entries
                </h3>
                <div className="px-3 py-1 bg-green-500/10 text-green-500 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-1">
                  <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></div>
                  Real-time
                </div>
              </div>

              <div className="space-y-6 relative">
                <AnimatePresence mode="popLayout">
                  {recentEntries.map((entry, idx) => (
                    <motion.div 
                      key={entry.id}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      layout
                      className="flex items-center justify-between p-4 bg-secondary/30 rounded-2xl border border-transparent hover:border-primary/20 transition-all group"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-background rounded-xl border border-border flex items-center justify-center text-primary">
                          <Ticket className="w-6 h-6" />
                        </div>
                        <div>
                          <div className="font-black text-sm">{entry.name}</div>
                          <div className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">{entry.location}</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-xs font-black font-mono text-primary">{entry.id}</div>
                        <div className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">{entry.time}</div>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>

                {/* Fade effect at bottom */}
                <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-background to-transparent pointer-events-none"></div>
              </div>

              <button className="w-full mt-8 py-5 bg-secondary text-foreground rounded-2xl font-black flex items-center justify-center gap-2 hover:bg-secondary/80 transition-all">
                Check My Entries
                <ArrowRight className="w-5 h-5" />
              </button>
            </div>
          </div>

        </div>
      </div>
    </main>
  );
}
