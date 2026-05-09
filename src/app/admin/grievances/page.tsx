"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { db } from "@/lib/firebase";
import { collection, query, orderBy, getDocs, doc, updateDoc, arrayUnion, serverTimestamp } from "firebase/firestore";
import { 
  MessageSquare, 
  Search, 
  Filter, 
  Clock, 
  CheckCircle2, 
  AlertCircle,
  User,
  ExternalLink,
  ChevronRight,
  ShieldCheck
} from "lucide-react";
import { cn } from "@/lib/utils";
import toast from "react-hot-toast";

export default function AdminGrievancesPage() {
  const { profile } = useAuth();
  const [tickets, setTickets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [selectedTicket, setSelectedTicket] = useState<any>(null);
  const [note, setNote] = useState("");
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    fetchTickets();
  }, []);

  const fetchTickets = async () => {
    try {
      const q = query(collection(db, "tickets"), orderBy("createdAt", "desc"));
      const snap = await getDocs(q);
      setTickets(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (ticketId: string, newStatus: string) => {
    if (profile?.role !== "grievance_officer" && profile?.role !== "admin") return;
    
    // Check if user is ONLY an admin (admins only monitor)
    if (profile.role === "admin" && newStatus !== "monitoring") {
      toast.error("Admins can only monitor. Issues must be addressed by a Grievance Officer.");
      return;
    }

    setUpdating(true);
    try {
      const ticketRef = doc(db, "tickets", ticketId);
      await updateDoc(ticketRef, {
        status: newStatus,
        updatedAt: serverTimestamp(),
        updates: arrayUnion({
          status: newStatus,
          note: note || `Status updated to ${newStatus}`,
          timestamp: new Date(),
          by: profile.displayName
        })
      });
      toast.success("Ticket updated!");
      setNote("");
      setSelectedTicket(null);
      fetchTickets();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setUpdating(false);
    }
  };

  const filteredTickets = tickets.filter(t => filter === "all" || t.status === filter);

  return (
    <div className="max-w-7xl mx-auto px-4 py-12">
      <div className="flex flex-col md:flex-row justify-between items-end mb-12 gap-6">
        <div>
          <h1 className="text-4xl font-black tracking-tight">Grievance Monitor</h1>
          <p className="text-muted-foreground mt-2">
            {profile?.role === "admin" 
              ? "Admins can monitor all active grievances and response times." 
              : "As Grievance Officer, you are responsible for resolving these tickets."}
          </p>
        </div>
        <div className="flex gap-4">
          {["all", "open", "in-progress", "resolved"].map(s => (
            <button 
              key={s}
              onClick={() => setFilter(s)}
              className={cn(
                "px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all",
                filter === s ? "bg-primary text-primary-foreground border-primary" : "bg-secondary/50 border-border text-muted-foreground"
              )}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Ticket List */}
        <div className="lg:col-span-8 space-y-4">
          {loading ? (
            <div className="p-20 text-center font-black animate-pulse">LOADING TICKETS...</div>
          ) : filteredTickets.length === 0 ? (
            <div className="p-20 text-center text-muted-foreground italic bg-secondary/20 rounded-[3rem] border border-dashed border-border">
              No tickets found for this filter.
            </div>
          ) : (
            filteredTickets.map((ticket) => (
              <div 
                key={ticket.id} 
                onClick={() => setSelectedTicket(ticket)}
                className={cn(
                  "p-6 bg-secondary/30 rounded-3xl border transition-all cursor-pointer group",
                  selectedTicket?.id === ticket.id ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"
                )}
              >
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-background rounded-xl flex items-center justify-center text-primary border border-border">
                      <MessageSquare className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="text-xs font-black uppercase tracking-widest text-muted-foreground">{ticket.category}</div>
                      <div className="font-bold">{ticket.subject}</div>
                    </div>
                  </div>
                  <div className={cn(
                    "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest",
                    ticket.status === "open" ? "bg-amber-500/10 text-amber-600" :
                    ticket.status === "resolved" ? "bg-success/10 text-success" : "bg-secondary text-muted-foreground"
                  )}>
                    {ticket.status}
                  </div>
                </div>
                
                <div className="flex items-center justify-between mt-6 pt-4 border-t border-border/50">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1.5 text-[10px] font-bold text-muted-foreground">
                      <User className="w-3 h-3" /> {ticket.userName}
                    </div>
                    <div className="flex items-center gap-1.5 text-[10px] font-bold text-muted-foreground">
                      <Clock className="w-3 h-3" /> {new Date(ticket.createdAt?.toDate?.()).toLocaleDateString()}
                    </div>
                  </div>
                  <div className="text-[10px] font-black text-primary uppercase flex items-center gap-1">
                    {ticket.ticketId} <ChevronRight className="w-3 h-3" />
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Detail Panel */}
        <div className="lg:col-span-4">
          <div className="bg-secondary/30 rounded-[2.5rem] border border-border p-8 sticky top-24">
            {selectedTicket ? (
              <div className="space-y-8 animate-in fade-in slide-in-from-right-4">
                <div>
                  <h3 className="text-xl font-black mb-1">Ticket Details</h3>
                  <p className="text-xs text-muted-foreground font-mono uppercase">{selectedTicket.ticketId}</p>
                </div>

                <div className="space-y-4">
                  <div className="p-4 bg-background rounded-2xl border border-border">
                    <div className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-2">Description</div>
                    <p className="text-sm leading-relaxed">{selectedTicket.description}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 bg-background rounded-2xl border border-border">
                      <div className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1">Customer</div>
                      <div className="text-sm font-bold">{selectedTicket.userName}</div>
                    </div>
                    <div className="p-4 bg-background rounded-2xl border border-border">
                      <div className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1">Phone</div>
                      <div className="text-sm font-bold">{selectedTicket.userPhone}</div>
                    </div>
                  </div>
                </div>

                <div className="space-y-4 pt-8 border-t border-border">
                  <h4 className="text-xs font-black uppercase tracking-widest text-primary">Resolution Action</h4>
                  <textarea 
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    placeholder="Add a note or resolution details..."
                    className="w-full p-4 bg-background border border-border rounded-2xl outline-none focus:ring-2 focus:ring-primary text-sm resize-none"
                    rows={3}
                  />
                  
                  {profile?.role === "admin" ? (
                    <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-2xl flex items-start gap-3">
                      <AlertCircle className="w-5 h-5 text-amber-600 shrink-0" />
                      <p className="text-[10px] font-bold text-amber-700 uppercase leading-relaxed">
                        Read-Only Access: As an admin, you can monitor this ticket. Only the Grievance Officer can resolve it.
                      </p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-3">
                      <button 
                        onClick={() => handleUpdateStatus(selectedTicket.id, "in-progress")}
                        disabled={updating || selectedTicket.status === "in-progress"}
                        className="py-3 bg-secondary text-foreground rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-border transition-all"
                      >
                        In Progress
                      </button>
                      <button 
                        onClick={() => handleUpdateStatus(selectedTicket.id, "resolved")}
                        disabled={updating || selectedTicket.status === "resolved"}
                        className="py-3 bg-primary text-primary-foreground rounded-xl text-[10px] font-black uppercase tracking-widest hover:scale-105 transition-all shadow-lg shadow-primary/20"
                      >
                        Resolve
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="py-20 text-center space-y-4">
                <ShieldCheck className="w-12 h-12 text-muted-foreground mx-auto opacity-20" />
                <p className="text-sm text-muted-foreground font-bold italic">Select a ticket to view details<br />and take action.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
