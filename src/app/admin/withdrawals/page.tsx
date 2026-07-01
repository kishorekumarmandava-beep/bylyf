"use client";

import React, { useState, useEffect } from "react";
import { db } from "@/lib/firebase";
import { collection, query, orderBy, onSnapshot, doc, updateDoc, serverTimestamp } from "firebase/firestore";
import { Banknote, CheckCircle2, Clock, Search, XCircle } from "lucide-react";
import toast from "react-hot-toast";
import { cn } from "@/lib/utils";

export default function AdminWithdrawalsPage() {
  const [withdrawals, setWithdrawals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [processing, setProcessing] = useState<string | null>(null);

  useEffect(() => {
    const q = query(collection(db, "withdrawals"), orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setWithdrawals(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
    }, (error) => {
      console.error("Error fetching withdrawals:", error);
      toast.error("Failed to load withdrawals.");
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleMarkProcessed = async (id: string) => {
    if (!confirm("Are you sure you have transferred the funds? This cannot be undone.")) return;
    setProcessing(id);
    try {
      await updateDoc(doc(db, "withdrawals", id), {
        status: "processed",
        processedAt: serverTimestamp(),
      });
      toast.success("Withdrawal marked as processed!");
    } catch (err: any) {
      toast.error(err.message || "Failed to update status.");
    } finally {
      setProcessing(null);
    }
  };

  const handleMarkRejected = async (id: string) => {
    if (!confirm("Are you sure you want to reject this withdrawal?")) return;
    setProcessing(id);
    try {
      await updateDoc(doc(db, "withdrawals", id), {
        status: "rejected",
        processedAt: serverTimestamp(),
      });
      toast.success("Withdrawal rejected.");
    } catch (err: any) {
      toast.error(err.message || "Failed to update status.");
    } finally {
      setProcessing(null);
    }
  };

  const filteredWithdrawals = withdrawals.filter(w => 
    w.agentName?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    w.upiId?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const pendingCount = withdrawals.filter(w => w.status === "pending").length;
  const pendingAmount = withdrawals.filter(w => w.status === "pending").reduce((acc, curr) => acc + (curr.amount || 0), 0);
  const totalPaidOut = withdrawals.filter(w => w.status === "processed").reduce((acc, curr) => acc + (curr.amount || 0), 0);

  return (
    <main className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 gap-4">
          <div>
            <h1 className="text-4xl font-black tracking-tight flex items-center gap-3">
              <Banknote className="w-8 h-8 text-primary" />
              Withdrawal Requests
            </h1>
            <p className="text-muted-foreground mt-2">Manage agent commission payouts and verify UPI transfers.</p>
          </div>
          <div className="flex gap-4 flex-wrap">
            <div className="bg-secondary/30 px-6 py-3 rounded-2xl border border-border text-center">
              <div className="text-2xl font-black text-amber-500">{pendingCount}</div>
              <div className="text-xs font-bold text-muted-foreground uppercase tracking-widest mt-1">Pending Requests</div>
            </div>
            <div className="bg-secondary/30 px-6 py-3 rounded-2xl border border-border text-center">
              <div className="text-2xl font-black text-amber-500">₹{pendingAmount.toLocaleString("en-IN")}</div>
              <div className="text-xs font-bold text-muted-foreground uppercase tracking-widest mt-1">Pending Amount</div>
            </div>
            <div className="bg-secondary/30 px-6 py-3 rounded-2xl border border-border text-center">
              <div className="text-2xl font-black text-green-600">₹{totalPaidOut.toLocaleString("en-IN")}</div>
              <div className="text-xs font-bold text-muted-foreground uppercase tracking-widest mt-1">Total Paid</div>
            </div>
          </div>
        </div>

        <div className="bg-secondary/30 border border-border rounded-[3rem] p-8">
          <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
            <h2 className="text-xl font-black">All Requests</h2>
            <div className="relative w-full md:w-96">
              <Search className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search by agent name or UPI ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-background border border-border rounded-xl font-bold outline-none focus:ring-2 focus:ring-primary transition-all"
              />
            </div>
          </div>

          {loading ? (
            <div className="py-20 text-center font-black animate-pulse">Loading requests...</div>
          ) : filteredWithdrawals.length === 0 ? (
            <div className="py-20 text-center text-muted-foreground">
              <Banknote className="w-12 h-12 mx-auto mb-4 opacity-20" />
              <p className="font-bold text-lg">No withdrawal requests found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b-2 border-border">
                    <th className="py-4 px-4 text-xs font-black uppercase tracking-widest text-muted-foreground">Agent Info</th>
                    <th className="py-4 px-4 text-xs font-black uppercase tracking-widest text-muted-foreground">Amount</th>
                    <th className="py-4 px-4 text-xs font-black uppercase tracking-widest text-muted-foreground">UPI ID</th>
                    <th className="py-4 px-4 text-xs font-black uppercase tracking-widest text-muted-foreground">Status</th>
                    <th className="py-4 px-4 text-xs font-black uppercase tracking-widest text-muted-foreground text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filteredWithdrawals.map((w) => (
                    <tr key={w.id} className="hover:bg-secondary/50 transition-colors">
                      <td className="py-4 px-4">
                        <div className="font-black text-sm">{w.agentName}</div>
                        <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-1">
                          {w.agentRole === "storefront_agent" ? "Storefront Agent" : "Referral Agent"}
                        </div>
                        <div className="text-[10px] text-muted-foreground mt-1">
                          {w.createdAt?.toDate ? w.createdAt.toDate().toLocaleString() : "Date N/A"}
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <div className="font-black text-lg text-primary">₹{w.amount?.toLocaleString("en-IN")}</div>
                      </td>
                      <td className="py-4 px-4">
                        <div className="font-mono text-sm font-bold bg-background px-3 py-1.5 rounded-lg border border-border inline-block select-all">
                          {w.upiId}
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <span className={cn(
                          "px-3 py-1 text-[10px] font-black uppercase tracking-widest rounded-full inline-flex items-center gap-1",
                          w.status === "pending" ? "bg-amber-500/10 text-amber-600" :
                          w.status === "processed" ? "bg-green-500/10 text-green-600" :
                          "bg-red-500/10 text-red-600"
                        )}>
                          {w.status === "pending" && <Clock className="w-3 h-3" />}
                          {w.status === "processed" && <CheckCircle2 className="w-3 h-3" />}
                          {w.status === "rejected" && <XCircle className="w-3 h-3" />}
                          {w.status}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-right">
                        {w.status === "pending" && (
                          <div className="flex justify-end gap-2">
                            <button
                              onClick={() => handleMarkProcessed(w.id)}
                              disabled={processing === w.id}
                              className="px-4 py-2 bg-green-600 text-white rounded-xl text-xs font-bold hover:bg-green-700 transition-colors disabled:opacity-50"
                            >
                              {processing === w.id ? "Processing..." : "Mark Processed"}
                            </button>
                            <button
                              onClick={() => handleMarkRejected(w.id)}
                              disabled={processing === w.id}
                              className="px-4 py-2 bg-secondary text-foreground rounded-xl text-xs font-bold hover:bg-secondary/80 transition-colors disabled:opacity-50"
                            >
                              Reject
                            </button>
                          </div>
                        )}
                        {w.status !== "pending" && (
                          <span className="text-xs text-muted-foreground font-bold">
                            {w.processedAt?.toDate ? w.processedAt.toDate().toLocaleDateString() : ""}
                          </span>
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
    </main>
  );
}
