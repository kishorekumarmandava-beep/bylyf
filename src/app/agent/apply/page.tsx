"use client";

import React, { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import Navbar from "@/components/layout/Navbar";
import { 
  Rocket, 
  Target, 
  TrendingUp, 
  ArrowRight, 
  CheckCircle2,
  Briefcase
} from "lucide-react";
import { doc, updateDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import toast from "react-hot-toast";

export default function AgentApplyPage() {
  const { user, profile } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleBecomeAgent = async () => {
    if (!user) {
      toast.error("Please sign in first");
      return;
    }
    setLoading(true);
    try {
      await updateDoc(doc(db, "users", user.uid), {
        agentStatus: "pending",
        agentAppliedAt: serverTimestamp(),
      });
      toast.success("Application Submitted! Our team will review and approve your account shortly.");
      router.push("/agent/dashboard");
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-background">
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 py-20">
        <div className="max-w-3xl mx-auto text-center mb-20">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-black uppercase tracking-widest mb-6">
            <Rocket className="w-5 h-5" />
            Partner Program
          </div>
          <h1 className="text-5xl lg:text-7xl font-black tracking-tight mb-8">
            Build Your Own <br /> <span className="text-primary">Digital Storefront.</span>
          </h1>
          <p className="text-xl text-muted-foreground leading-relaxed">
            Join the BYLYF Agent Network. Empower your community with premium products and earn a lifetime commission on every referral.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-20">
          {[
            { 
              icon: Target, 
              title: "Exclusive Perks", 
              desc: "Get early access to bumper draws and high-demand product launches." 
            },
            { 
              icon: TrendingUp, 
              title: "High Commissions", 
              desc: "Earn up to 5% commission on every sale made through your link." 
            },
            { 
              icon: Briefcase, 
              title: "Agent Toolkit", 
              desc: "Professional tools and dashboards to track your growth in real-time." 
            }
          ].map((feature, i) => (
            <div key={i} className="p-10 bg-secondary/30 rounded-[3rem] border border-border hover:bg-secondary/50 transition-colors">
              <div className="w-14 h-14 bg-primary rounded-2xl flex items-center justify-center mb-8 shadow-lg shadow-primary/20">
                <feature.icon className="w-7 h-7 text-primary-foreground" />
              </div>
              <h3 className="text-2xl font-black mb-4">{feature.title}</h3>
              <p className="text-muted-foreground leading-relaxed">{feature.desc}</p>
            </div>
          ))}
        </div>

        <div className="bg-primary text-primary-foreground rounded-[4rem] p-12 lg:p-20 text-center relative overflow-hidden shadow-3xl shadow-primary/30">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[150%] h-[150%] bg-[radial-gradient(circle_at_center,var(--primary-foreground)_0%,transparent_70%)] opacity-5"></div>
          
          <div className="relative z-10 max-w-2xl mx-auto">
            <h2 className="text-4xl lg:text-5xl font-black tracking-tight mb-8">Ready to start earning?</h2>
            <div className="flex flex-col items-center gap-8">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full">
                <div className="flex items-center gap-3 text-left p-4 bg-white/10 rounded-2xl border border-white/10">
                  <CheckCircle2 className="w-6 h-6 text-white" />
                  <span className="font-bold">Instant Activation</span>
                </div>
                <div className="flex items-center gap-3 text-left p-4 bg-white/10 rounded-2xl border border-white/10">
                  <CheckCircle2 className="w-6 h-6 text-white" />
                  <span className="font-bold">No Hidden Fees</span>
                </div>
              </div>

              <button 
                onClick={handleBecomeAgent}
                disabled={loading}
                className="w-full sm:w-auto px-12 py-6 bg-white text-primary rounded-[2rem] font-black text-xl shadow-2xl hover:scale-105 transition-all flex items-center justify-center gap-3"
              >
                {loading ? "Activating..." : "Become an Agent Now"}
                <ArrowRight className="w-6 h-6" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
