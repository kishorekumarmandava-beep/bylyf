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
  Briefcase,
  ShieldCheck,
  CreditCard,
  Image as ImageIcon,
  Upload
} from "lucide-react";
import { doc, updateDoc, serverTimestamp } from "firebase/firestore";
import { db, storage } from "@/lib/firebase";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import toast from "react-hot-toast";
import { cn } from "@/lib/utils";

export default function AgentApplyPage() {
  const { user, profile } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [panNumber, setPanNumber] = useState("");
  const [panImage, setPanImage] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error("Image size should be less than 5MB");
        return;
      }
      setPanImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleBecomeAgent = async () => {
    if (!user) {
      toast.error("Please sign in first");
      return;
    }

    if (!panNumber || panNumber.length !== 10) {
      toast.error("Please enter a valid 10-character PAN number");
      return;
    }

    if (!panImage) {
      toast.error("Please upload your PAN card image");
      return;
    }

    setLoading(true);
    try {
      // 1. Upload PAN card image
      const storageRef = ref(storage, `agent_documents/${user.uid}/pan_card_${Date.now()}`);
      const uploadResult = await uploadBytes(storageRef, panImage);
      const panCardUrl = await getDownloadURL(uploadResult.ref);

      // 2. Update user profile
      await updateDoc(doc(db, "users", user.uid), {
        agentStatus: "pending",
        agentAppliedAt: serverTimestamp(),
        panNumber: panNumber.toUpperCase(),
        panCardUrl: panCardUrl,
      });

      toast.success("Application Submitted! Our team will review and approve your account shortly.");
      router.push("/agent/dashboard");
    } catch (error: any) {
      console.error(error);
      toast.error(error.message || "Failed to submit application");
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
            
            <div className="bg-white/10 backdrop-blur-md rounded-[2.5rem] p-8 mb-12 border border-white/10 text-left">
              <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                <ShieldCheck className="w-6 h-6" />
                Verification Details
              </h3>
              
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-bold mb-2 opacity-70 uppercase tracking-widest">PAN Card Number</label>
                  <div className="relative">
                    <CreditCard className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 opacity-40" />
                    <input 
                      type="text"
                      placeholder="ABCDE1234F"
                      maxLength={10}
                      value={panNumber}
                      onChange={(e) => setPanNumber(e.target.value.toUpperCase())}
                      className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 outline-none focus:ring-2 focus:ring-white/20 transition-all font-mono font-bold"
                    />
                  </div>
                  <p className="mt-2 text-[10px] opacity-50 font-bold uppercase tracking-widest">Required for TDS deduction and legal compliance</p>
                </div>

                <div>
                  <label className="block text-sm font-bold mb-2 opacity-70 uppercase tracking-widest">Upload PAN Card Image</label>
                  <label className="relative group cursor-pointer block">
                    <input 
                      type="file"
                      accept="image/*"
                      onChange={handleImageChange}
                      className="hidden"
                    />
                    <div className={cn(
                      "w-full aspect-video rounded-3xl border-2 border-dashed flex flex-col items-center justify-center transition-all",
                      previewUrl ? "border-white/20 bg-white/5" : "border-white/10 hover:border-white/30 bg-white/5"
                    )}>
                      {previewUrl ? (
                        <div className="relative w-full h-full p-4">
                          <img src={previewUrl} alt="PAN Preview" className="w-full h-full object-contain rounded-xl" />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center rounded-3xl transition-opacity">
                            <Upload className="w-8 h-8 text-white" />
                          </div>
                        </div>
                      ) : (
                        <>
                          <ImageIcon className="w-10 h-10 mb-2 opacity-40" />
                          <p className="text-xs font-bold opacity-60">Click to upload image (Max 5MB)</p>
                        </>
                      )}
                    </div>
                  </label>
                </div>
              </div>
            </div>

            <div className="flex flex-col items-center gap-8">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full">
                <div className="flex items-center gap-3 text-left p-4 bg-white/10 rounded-2xl border border-white/10">
                  <CheckCircle2 className="w-6 h-6 text-white" />
                  <span className="font-bold">Verified Status</span>
                </div>
                <div className="flex items-center gap-3 text-left p-4 bg-white/10 rounded-2xl border border-white/10">
                  <CheckCircle2 className="w-6 h-6 text-white" />
                  <span className="font-bold">Legal Compliance</span>
                </div>
              </div>

              <button 
                onClick={handleBecomeAgent}
                disabled={loading}
                className="w-full sm:w-auto px-12 py-6 bg-white text-primary rounded-[2rem] font-black text-xl shadow-2xl hover:scale-105 transition-all flex items-center justify-center gap-3 disabled:opacity-50"
              >
                {loading ? "Submitting..." : "Apply Now"}
                <ArrowRight className="w-6 h-6" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
