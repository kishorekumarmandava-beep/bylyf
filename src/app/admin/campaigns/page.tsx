"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { 
  Zap, 
  Settings, 
  Play, 
  Pause, 
  Plus, 
  Trophy, 
  AlertTriangle,
  History,
  CheckCircle2,
  Trash2,
  XCircle,
  Clock
} from "lucide-react";
import { db } from "@/lib/firebase";
import { collection, query, orderBy, onSnapshot, doc, setDoc, updateDoc, getDoc, serverTimestamp, getDocs, where, deleteDoc } from "firebase/firestore";
import toast from "react-hot-toast";
import { cn } from "@/lib/utils";

export default function AdminCampaignsPage() {
  const { profile } = useAuth();
  const [loading, setLoading] = useState(true);
  
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [autoRolloverPaused, setAutoRolloverPaused] = useState(false);
  
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newCampaign, setNewCampaign] = useState({
    title: "",
    prizeDescription: "",
    prizeValue: "",
    targetCoupons: ""
  });

  useEffect(() => {
    // 1. Listen to global settings for rollover pause
    const settingsUnsub = onSnapshot(doc(db, "settings", "agent_config"), (docSnap) => {
      if (docSnap.exists() && docSnap.data().autoRolloverPaused !== undefined) {
        setAutoRolloverPaused(docSnap.data().autoRolloverPaused);
      }
    }, (err) => {
      console.error("Error fetching settings:", err);
    });

    // 2. Listen to campaigns
    const q = query(collection(db, "campaigns"), orderBy("createdAt", "desc"));
    const campaignsUnsub = onSnapshot(q, (snapshot) => {
      const camps = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setCampaigns(camps);
      setLoading(false);
    }, (err) => {
      console.error("Error fetching campaigns:", err);
      toast.error("Permission error fetching campaigns. Are Firestore rules deployed?");
      setLoading(false);
    });

    return () => {
      settingsUnsub();
      campaignsUnsub();
    };
  }, []);

  const activeCampaign = campaigns.find(c => c.status === "active" || c.status === "drawing");
  const upcomingCampaigns = campaigns.filter(c => c.status === "upcoming");
  const pastCampaigns = campaigns.filter(c => c.status === "completed" || c.status === "force_closed");

  const toggleAutoRollover = async () => {
    try {
      await setDoc(doc(db, "settings", "agent_config"), {
        autoRolloverPaused: !autoRolloverPaused
      }, { merge: true });
      
      // Audit log
      if (profile) {
        await setDoc(doc(collection(db, "audit_logs")), {
          action: "toggle_campaign_rollover",
          newState: !autoRolloverPaused,
          adminUid: profile.uid,
          adminName: profile.displayName || "Admin",
          timestamp: serverTimestamp()
        });
      }
      toast.success(`Auto-rollover ${!autoRolloverPaused ? 'paused' : 'resumed'}`);
    } catch (err: any) {
      toast.error("Failed to update setting: " + err.message);
    }
  };

  const handleCreateCampaign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCampaign.title || !newCampaign.prizeDescription || !newCampaign.targetCoupons) {
      toast.error("Please fill all required fields");
      return;
    }

    try {
      const campaignId = `DRAW-${Date.now().toString().slice(-6)}`;
      
      // If there's no active campaign, make this one active immediately
      const isFirst = !activeCampaign;
      
      const campaignData = {
        campaignId,
        title: newCampaign.title,
        prizeDescription: newCampaign.prizeDescription,
        prizeValue: Number(newCampaign.prizeValue) || 0,
        targetCoupons: Number(newCampaign.targetCoupons),
        currentCoupons: 0,
        status: isFirst ? "active" : "upcoming",
        winnerEntryId: null,
        winnerDetails: null,
        createdAt: serverTimestamp(),
        startedAt: isFirst ? serverTimestamp() : null
      };

      await setDoc(doc(db, "campaigns", campaignId), campaignData);
      
      if (profile) {
        await setDoc(doc(collection(db, "audit_logs")), {
          action: "create_campaign",
          campaignId,
          adminUid: profile.uid,
          adminName: profile.displayName || "Admin",
          timestamp: serverTimestamp()
        });
      }

      toast.success(`Campaign ${campaignId} created!`);
      setShowCreateModal(false);
      setNewCampaign({
        title: "",
        prizeDescription: "",
        prizeValue: "",
        targetCoupons: ""
      });
    } catch (err: any) {
      toast.error("Failed to create campaign: " + err.message);
    }
  };

  const forceCloseCampaign = async (campaignId: string, pickWinner: boolean) => {
    if (!confirm(`Are you sure you want to FORCE CLOSE this campaign? ${pickWinner ? 'A winner will be picked from the current pool.' : 'NO WINNER will be picked.'}`)) {
      return;
    }

    try {
      const updates: any = {
        status: "force_closed",
        endedAt: serverTimestamp()
      };

      if (pickWinner) {
        // Find a random winner securely from this campaign
        const entriesQ = query(collection(db, "lucky_draw_entries"), where("campaignId", "==", campaignId));
        const entriesSnap = await getDocs(entriesQ);
        
        if (!entriesSnap.empty) {
          const entries = entriesSnap.docs.map(d => ({id: d.id, ...d.data()}));
          // Use cryptographic randomness
          const randomArray = new Uint32Array(1);
          window.crypto.getRandomValues(randomArray);
          const randomIndex = randomArray[0] % entries.length;
          const winner = entries[randomIndex] as any;
          
          updates.winnerEntryId = winner.couponId;
          updates.winnerDetails = {
            name: winner.maskedName,
            userId: winner.userId || "anonymous",
            orderId: winner.orderId
          };
        } else {
          toast.error("No entries found in this campaign to pick a winner from.");
          updates.winnerEntryId = "NO_ENTRIES";
        }
      }

      await updateDoc(doc(db, "campaigns", campaignId), updates);
      
      if (profile) {
        await setDoc(doc(collection(db, "audit_logs")), {
          action: "force_close_campaign",
          campaignId,
          pickWinner,
          adminUid: profile.uid,
          adminName: profile.displayName || "Admin",
          timestamp: serverTimestamp()
        });
      }

      toast.success(`Campaign force closed.`);
      
      // Attempt auto-rollover
      if (!autoRolloverPaused) {
        const upQ = query(collection(db, "campaigns"), where("status", "==", "upcoming"), orderBy("createdAt", "asc"));
        const upSnap = await getDocs(upQ);
        if (!upSnap.empty) {
          const nextCamp = upSnap.docs[0];
          await updateDoc(doc(db, "campaigns", nextCamp.id), {
            status: "active",
            startedAt: serverTimestamp()
          });
          toast.success(`Rolled over to next campaign: ${nextCamp.id}`);
        }
      }

    } catch (err: any) {
      toast.error("Error closing campaign: " + err.message);
    }
  };

  const deleteUpcomingCampaign = async (campaignId: string) => {
    if (!confirm("Are you sure you want to delete this upcoming campaign?")) return;
    try {
      await deleteDoc(doc(db, "campaigns", campaignId));
      toast.success("Campaign deleted");
    } catch (err: any) {
      toast.error("Error deleting campaign: " + err.message);
    }
  };

  if (loading) {
    return <div className="p-12 text-center text-muted-foreground animate-pulse">Loading campaigns...</div>;
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-12">
      <div className="flex justify-between items-center mb-12">
        <div>
          <h1 className="text-4xl font-black tracking-tight flex items-center gap-3">
            <Trophy className="w-8 h-8 text-primary" />
            Campaign Manager
          </h1>
          <p className="text-muted-foreground mt-2">Manage lucky draw buckets, monitor progress, and control rollovers.</p>
        </div>
        
        <div className="flex gap-4">
          <button 
            onClick={toggleAutoRollover}
            className={cn(
              "px-6 py-3 rounded-2xl font-black flex items-center gap-2 transition-all shadow-lg",
              autoRolloverPaused 
                ? "bg-destructive/10 text-destructive hover:bg-destructive/20" 
                : "bg-success/10 text-success hover:bg-success/20"
            )}
          >
            {autoRolloverPaused ? <Play className="w-5 h-5" /> : <Pause className="w-5 h-5" />}
            {autoRolloverPaused ? "Rollover Paused" : "Rollover Active"}
          </button>
          
          <button 
            onClick={() => setShowCreateModal(true)}
            className="px-6 py-3 bg-primary text-primary-foreground rounded-2xl font-black flex items-center gap-2 hover:scale-105 transition-all shadow-xl shadow-primary/20"
          >
            <Plus className="w-5 h-5" />
            Create Campaign
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Col: Active Campaign */}
        <div className="lg:col-span-2 space-y-8">
          <div className="bg-secondary/30 rounded-[3rem] border border-border p-10 relative overflow-hidden">
            {activeCampaign ? (
              <>
                <div className="absolute top-0 right-0 p-8">
                  <div className="inline-flex items-center gap-2 px-3 py-1 bg-green-500/10 text-green-500 rounded-full text-xs font-black uppercase tracking-widest">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                    {activeCampaign.status === "drawing" ? "Drawing..." : "Live Active"}
                  </div>
                </div>

                <div className="text-sm font-bold text-muted-foreground uppercase tracking-widest mb-2">{activeCampaign.campaignId}</div>
                <h2 className="text-4xl font-black tracking-tighter mb-4">{activeCampaign.title}</h2>
                <div className="text-xl text-primary font-bold mb-8">{activeCampaign.prizeDescription}</div>

                <div className="bg-background rounded-3xl p-8 border border-border mb-8">
                  <div className="flex justify-between items-end mb-4">
                    <div>
                      <div className="text-4xl font-black">{activeCampaign.currentCoupons}</div>
                      <div className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Current Coupons</div>
                    </div>
                    <div className="text-right">
                      <div className="text-xl font-bold">{activeCampaign.targetCoupons}</div>
                      <div className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Target</div>
                    </div>
                  </div>
                  
                  <div className="h-4 bg-secondary rounded-full overflow-hidden p-1 border border-border">
                    <div 
                      className="h-full bg-primary rounded-full transition-all duration-1000"
                      style={{ width: `${Math.min(100, (activeCampaign.currentCoupons / activeCampaign.targetCoupons) * 100)}%` }}
                    ></div>
                  </div>
                </div>

                {activeCampaign.intermediateWinners && activeCampaign.intermediateWinners.length > 0 && (
                  <div className="mb-8">
                    <h4 className="font-bold text-sm text-muted-foreground uppercase tracking-widest mb-3">Intermediate Winners</h4>
                    <div className="space-y-2 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
                      {[...activeCampaign.intermediateWinners].reverse().map((w: any, i: number) => (
                        <div key={i} className="flex justify-between items-center p-3 bg-background rounded-xl border border-border">
                          <div>
                            <span className="font-black mr-2">#{w.milestone}</span>
                            <span className="text-sm font-bold">{w.name}</span>
                          </div>
                          <div className="text-xs text-primary font-bold text-right">{w.prizeName}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex gap-4">
                  <button 
                    onClick={() => forceCloseCampaign(activeCampaign.id, true)}
                    className="flex-1 py-4 bg-destructive/10 text-destructive rounded-2xl font-black flex items-center justify-center gap-2 hover:bg-destructive hover:text-destructive-foreground transition-colors border border-destructive/20"
                  >
                    <CheckCircle2 className="w-5 h-5" />
                    Force Close & Pick Winner
                  </button>
                  <button 
                    onClick={() => forceCloseCampaign(activeCampaign.id, false)}
                    className="py-4 px-6 bg-secondary text-muted-foreground rounded-2xl font-black flex items-center justify-center gap-2 hover:bg-destructive hover:text-destructive-foreground transition-colors"
                  >
                    <XCircle className="w-5 h-5" />
                    Cancel Draw
                  </button>
                </div>
              </>
            ) : (
              <div className="text-center py-12">
                <AlertTriangle className="w-16 h-16 text-muted-foreground mx-auto mb-4 opacity-50" />
                <h3 className="text-2xl font-black mb-2">No Active Campaign</h3>
                <p className="text-muted-foreground">Create a campaign or unpause rollover to start issuing coupons.</p>
              </div>
            )}
          </div>

          {/* Past Campaigns */}
          <div className="bg-background rounded-[2.5rem] border border-border overflow-hidden">
            <div className="p-8 border-b border-border flex items-center gap-3">
              <History className="w-6 h-6 text-primary" />
              <h3 className="text-xl font-black">Campaign History</h3>
            </div>
            {pastCampaigns.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground font-bold">No completed campaigns yet.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-secondary/30">
                    <tr>
                      <th className="px-6 py-4 text-xs font-black uppercase tracking-widest">ID</th>
                      <th className="px-6 py-4 text-xs font-black uppercase tracking-widest">Title</th>
                      <th className="px-6 py-4 text-xs font-black uppercase tracking-widest">Coupons</th>
                      <th className="px-6 py-4 text-xs font-black uppercase tracking-widest">Status</th>
                      <th className="px-6 py-4 text-xs font-black uppercase tracking-widest">Winner</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/50">
                    {pastCampaigns.map(c => (
                      <tr key={c.id}>
                        <td className="px-6 py-4 font-mono text-xs font-bold">{c.campaignId}</td>
                        <td className="px-6 py-4 font-bold text-sm">{c.title}</td>
                        <td className="px-6 py-4 font-medium text-sm">{c.currentCoupons}/{c.targetCoupons}</td>
                        <td className="px-6 py-4">
                          <span className={cn(
                            "px-2 py-1 rounded-md text-[10px] font-black uppercase tracking-widest",
                            c.status === 'completed' ? "bg-success/10 text-success" : "bg-destructive/10 text-destructive"
                          )}>
                            {c.status}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="font-mono text-xs text-primary font-bold">{c.winnerEntryId ? `Bumper: ${c.winnerEntryId}` : "N/A"}</div>
                          {c.intermediateWinners && c.intermediateWinners.length > 0 && (
                            <div className="text-[10px] text-muted-foreground mt-1 font-bold">
                              +{c.intermediateWinners.length} intermediate
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

        </div>

        {/* Right Col: Upcoming Queue */}
        <div className="space-y-6">
          <div className="flex items-center gap-3 px-2">
            <Clock className="w-6 h-6 text-primary" />
            <h3 className="text-2xl font-black">Upcoming Queue</h3>
          </div>
          
          {upcomingCampaigns.length === 0 ? (
            <div className="p-8 bg-secondary/30 rounded-[2rem] border border-dashed border-border text-center">
              <p className="text-sm font-bold text-muted-foreground">Queue is empty.</p>
              {!autoRolloverPaused && <p className="text-[10px] uppercase tracking-widest text-warning mt-2 font-black">⚠️ System will generate a default campaign when active one ends.</p>}
            </div>
          ) : (
            upcomingCampaigns.map((c, idx) => (
              <div key={c.id} className="p-6 bg-secondary/30 rounded-[2rem] border border-border relative group">
                <div className="absolute top-4 right-4 bg-background w-8 h-8 rounded-full flex items-center justify-center font-black text-sm border border-border">
                  {idx + 1}
                </div>
                <div className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-1">{c.campaignId}</div>
                <h4 className="font-black text-lg mb-2">{c.title}</h4>
                <div className="text-sm font-medium mb-4">{c.targetCoupons} Target Coupons</div>
                <button 
                  onClick={() => deleteUpcomingCampaign(c.id)}
                  className="px-3 py-1.5 bg-destructive/10 text-destructive rounded-lg text-xs font-black uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity hover:bg-destructive hover:text-destructive-foreground flex items-center gap-1"
                >
                  <Trash2 className="w-3 h-3" /> Remove
                </button>
              </div>
            ))
          )}
        </div>

      </div>

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
          <div className="bg-background rounded-[3rem] p-10 max-w-md w-full shadow-2xl border border-border relative">
            <button 
              onClick={() => setShowCreateModal(false)}
              className="absolute top-6 right-6 text-muted-foreground hover:text-foreground"
            >
              <XCircle className="w-6 h-6" />
            </button>
            
            <h2 className="text-2xl font-black mb-6">New Campaign</h2>
            
            <form onSubmit={handleCreateCampaign} className="space-y-4">
              <div>
                <label className="text-sm font-bold ml-1">Campaign Title</label>
                <input 
                  type="text" 
                  value={newCampaign.title}
                  onChange={e => setNewCampaign({...newCampaign, title: e.target.value})}
                  placeholder="e.g., Summer Mega Draw"
                  className="w-full px-4 py-3 bg-secondary/50 border border-border rounded-xl mt-1 focus:ring-2 focus:ring-primary outline-none"
                />
              </div>
              <div>
                <label className="text-sm font-bold ml-1">Prize Description</label>
                <input 
                  type="text" 
                  value={newCampaign.prizeDescription}
                  onChange={e => setNewCampaign({...newCampaign, prizeDescription: e.target.value})}
                  placeholder="e.g., iPhone 16 Pro Max"
                  className="w-full px-4 py-3 bg-secondary/50 border border-border rounded-xl mt-1 focus:ring-2 focus:ring-primary outline-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-bold ml-1">Target Coupons</label>
                  <input 
                    type="number" 
                    value={newCampaign.targetCoupons}
                    onChange={e => setNewCampaign({...newCampaign, targetCoupons: e.target.value})}
                    placeholder="2000"
                    className="w-full px-4 py-3 bg-secondary/50 border border-border rounded-xl mt-1 focus:ring-2 focus:ring-primary outline-none font-mono"
                  />
                </div>
                <div>
                  <label className="text-sm font-bold ml-1">Prize Value (₹)</label>
                  <input 
                    type="number" 
                    value={newCampaign.prizeValue}
                    onChange={e => setNewCampaign({...newCampaign, prizeValue: e.target.value})}
                    placeholder="144900"
                    className="w-full px-4 py-3 bg-secondary/50 border border-border rounded-xl mt-1 focus:ring-2 focus:ring-primary outline-none font-mono"
                  />
                </div>
              </div>
              
              <button 
                type="submit"
                className="w-full py-4 mt-4 bg-primary text-primary-foreground rounded-xl font-black shadow-lg shadow-primary/20"
              >
                Queue Campaign
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
