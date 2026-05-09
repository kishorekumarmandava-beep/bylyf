"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { 
  Users, 
  CheckCircle2, 
  XCircle, 
  Search, 
  ShieldCheck, 
  Zap,
  MoreVertical,
  Mail,
  Phone
} from "lucide-react";
import { db } from "@/lib/firebase";
import { collection, query, where, getDocs, updateDoc, doc } from "firebase/firestore";
import toast from "react-hot-toast";
import { cn } from "@/lib/utils";

export default function AdminAgentsPage() {
  const { profile } = useAuth();
  const router = useRouter();
  const [pendingAgents, setPendingAgents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPendingAgents();
  }, []);

  const fetchPendingAgents = async () => {
    try {
      const q = query(collection(db, "users"), where("agentStatus", "==", "pending"));
      const snapshot = await getDocs(q);
      setPendingAgents(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (userId: string, role: "agent" | "storefront_agent") => {
    try {
      await updateDoc(doc(db, "users", userId), {
        agentStatus: "active",
        role: role,
        agentJoinedAt: new Date()
      });
      toast.success(`Agent approved as ${role.replace("_", " ")}!`);
      fetchPendingAgents();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const handleReject = async (userId: string) => {
    try {
      await updateDoc(doc(db, "users", userId), {
        agentStatus: "rejected",
        role: "user"
      });
      toast.success("Application rejected.");
      fetchPendingAgents();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="flex flex-col md:flex-row justify-between items-end mb-12 gap-6">
          <div>
            <h1 className="text-4xl font-black tracking-tight">Agent Approvals</h1>
            <p className="text-muted-foreground mt-2">Review and approve your future storefront and referral partners.</p>
          </div>
          
          <div className="flex gap-4">
            <div className="bg-secondary/30 px-6 py-3 rounded-2xl border border-border flex items-center gap-2">
              <Users className="w-5 h-5 text-primary" />
              <span className="font-black">{pendingAgents.length} Pending</span>
            </div>
          </div>
        </div>

        {/* List of Pending Agents */}
        <div className="bg-secondary/30 rounded-[3rem] border border-border overflow-hidden">
          {loading ? (
            <div className="p-20 text-center font-black">LOADING APPLICATIONS...</div>
          ) : pendingAgents.length === 0 ? (
            <div className="p-20 text-center text-muted-foreground italic">
              No pending agent applications at the moment.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-8">
              {pendingAgents.map((agent) => (
                <div key={agent.id} className="bg-background rounded-[2.5rem] border border-border p-8 hover:border-primary/30 transition-all group">
                  <div className="flex items-start justify-between mb-6">
                    <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center text-primary font-black text-xl">
                      {agent.displayName?.[0] || "?"}
                    </div>
                    <div className="text-right">
                      <div className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Applied</div>
                      <div className="text-xs font-bold">{agent.agentAppliedAt?.toDate().toLocaleDateString()}</div>
                    </div>
                  </div>

                  <h3 className="text-xl font-black mb-2">{agent.displayName || "Unknown User"}</h3>
                  
                  <div className="space-y-3 mb-8">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Mail className="w-4 h-4" /> {agent.email || "No email"}
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Phone className="w-4 h-4" /> {agent.phoneNumber || "No phone"}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <button 
                      onClick={() => handleApprove(agent.id, "agent")}
                      className="py-3 bg-secondary text-foreground rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-primary hover:text-primary-foreground transition-all flex items-center justify-center gap-2"
                    >
                      <ShieldCheck className="w-4 h-4" />
                      Referral Agent
                    </button>
                    <button 
                      onClick={() => handleApprove(agent.id, "storefront_agent")}
                      className="py-3 bg-primary text-primary-foreground rounded-xl text-[10px] font-black uppercase tracking-widest hover:scale-105 transition-all flex items-center justify-center gap-2"
                    >
                      <Zap className="w-4 h-4 fill-current" />
                      Storefront
                    </button>
                  </div>
                  
                  <button 
                    onClick={() => handleReject(agent.id)}
                    className="w-full mt-3 py-3 text-destructive font-black text-[10px] uppercase tracking-widest hover:bg-destructive/5 rounded-xl transition-all"
                  >
                    Reject Application
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
