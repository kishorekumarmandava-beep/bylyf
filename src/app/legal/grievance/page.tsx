"use client";

import React, { useState } from "react";
import Navbar from "@/components/layout/Navbar";
import { 
  Scale, 
  Mail, 
  Phone, 
  MapPin, 
  Clock, 
  ShieldCheck,
  ChevronRight,
  Send,
  Search,
  MessageSquare,
  AlertCircle
} from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { db } from "@/lib/firebase";
import { collection, addDoc, serverTimestamp, query, where, getDocs, limit } from "firebase/firestore";
import toast from "react-hot-toast";
import { cn } from "@/lib/utils";

function GrievanceForm() {
  const { user, profile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    orderId: "",
    category: "General",
    subject: "",
    description: ""
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      toast.error("Please login to raise a grievance.");
      return;
    }
    setLoading(true);
    try {
      const ticketId = `GR-${Math.floor(10000 + Math.random() * 90000)}`;
      await addDoc(collection(db, "tickets"), {
        ticketId,
        userId: user.uid,
        userName: profile?.displayName || "Anonymous",
        userPhone: user.phoneNumber,
        ...formData,
        status: "open",
        priority: "medium",
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        updates: [{
          status: "open",
          note: "Ticket created successfully.",
          timestamp: new Date()
        }]
      });
      toast.success(`Grievance submitted! Ticket ID: ${ticketId}`);
      setFormData({ orderId: "", category: "General", subject: "", description: "" });
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <label className="text-sm font-bold ml-1">Order ID (Optional)</label>
          <input 
            type="text"
            value={formData.orderId}
            onChange={(e) => setFormData({...formData, orderId: e.target.value})}
            placeholder="e.g. #123456"
            className="w-full px-5 py-4 bg-background border border-border rounded-2xl outline-none focus:ring-2 focus:ring-primary transition-all"
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-bold ml-1">Category</label>
          <select 
            value={formData.category}
            onChange={(e) => setFormData({...formData, category: e.target.value})}
            className="w-full px-5 py-4 bg-background border border-border rounded-2xl outline-none focus:ring-2 focus:ring-primary transition-all font-bold"
          >
            <option>General</option>
            <option>Payment Issue</option>
            <option>Delivery Delay</option>
            <option>Wrong Product</option>
            <option>Refund Request</option>
            <option>Agent Complaint</option>
          </select>
        </div>
      </div>
      <div className="space-y-2">
        <label className="text-sm font-bold ml-1">Subject</label>
        <input 
          type="text"
          required
          value={formData.subject}
          onChange={(e) => setFormData({...formData, subject: e.target.value})}
          placeholder="Brief summary of your issue"
          className="w-full px-5 py-4 bg-background border border-border rounded-2xl outline-none focus:ring-2 focus:ring-primary transition-all"
        />
      </div>
      <div className="space-y-2">
        <label className="text-sm font-bold ml-1">Detailed Description</label>
        <textarea 
          required
          rows={4}
          value={formData.description}
          onChange={(e) => setFormData({...formData, description: e.target.value})}
          placeholder="Please describe your issue in detail..."
          className="w-full px-5 py-4 bg-background border border-border rounded-2xl outline-none focus:ring-2 focus:ring-primary transition-all resize-none"
        />
      </div>
      <button 
        disabled={loading}
        className="w-full py-5 bg-primary text-primary-foreground rounded-[1.5rem] font-black uppercase tracking-widest flex items-center justify-center gap-3 hover:scale-[1.02] transition-all shadow-xl shadow-primary/20 disabled:opacity-50"
      >
        {loading ? "SUBMITTING..." : "Submit Grievance"}
        <Send className="w-5 h-5" />
      </button>
    </form>
  );
}

function TicketTracker() {
  const [ticketId, setTicketId] = useState("");
  const [loading, setLoading] = useState(false);
  const [ticket, setTicket] = useState<any>(null);

  const handleTrack = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setTicket(null);
    try {
      const q = query(collection(db, "tickets"), where("ticketId", "==", ticketId.toUpperCase()), limit(1));
      const snap = await getDocs(q);
      if (snap.empty) {
        toast.error("Ticket ID not found.");
      } else {
        setTicket(snap.docs[0].data());
      }
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      <form onSubmit={handleTrack} className="flex gap-4">
        <input 
          type="text"
          required
          value={ticketId}
          onChange={(e) => setTicketId(e.target.value)}
          placeholder="Enter Ticket ID (e.g. GR-12345)"
          className="flex-1 px-5 py-4 bg-background border border-border rounded-2xl outline-none focus:ring-2 focus:ring-primary transition-all font-mono"
        />
        <button 
          disabled={loading}
          className="px-8 py-4 bg-primary text-primary-foreground rounded-2xl font-black flex items-center justify-center disabled:opacity-50"
        >
          {loading ? "..." : <Search className="w-5 h-5" />}
        </button>
      </form>

      {ticket && (
        <div className="text-left bg-background rounded-3xl border border-border p-8 animate-in fade-in slide-in-from-bottom-4">
          <div className="flex justify-between items-start mb-6">
            <div>
              <div className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1">Ticket ID</div>
              <div className="text-2xl font-black text-primary font-mono">{ticket.ticketId}</div>
            </div>
            <div className={cn(
              "px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest",
              ticket.status === "open" ? "bg-amber-500/10 text-amber-600" :
              ticket.status === "resolved" ? "bg-success/10 text-success" : "bg-secondary text-muted-foreground"
            )}>
              {ticket.status}
            </div>
          </div>

          <div className="space-y-6">
            <div>
              <div className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1">Subject</div>
              <div className="font-bold">{ticket.subject}</div>
            </div>
            
            <div className="p-4 bg-secondary/30 rounded-2xl border border-border">
              <div className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-3 flex items-center gap-2">
                <MessageSquare className="w-3 h-3" /> Latest Update
              </div>
              <div className="text-sm font-medium leading-relaxed">
                {ticket.updates?.[ticket.updates.length - 1]?.note || "Awaiting initial review."}
              </div>
              <div className="text-[10px] text-muted-foreground mt-2 font-bold uppercase">
                Updated on {new Date(ticket.updatedAt?.toDate?.() || Date.now()).toLocaleDateString()}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function GrievancePage() {
  return (
    <main className="min-h-screen bg-background">
      <Navbar />

      <div className="max-w-4xl mx-auto px-4 py-20">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-black uppercase tracking-widest mb-6">
            <Scale className="w-5 h-5" />
            Compliance
          </div>
          <h1 className="text-5xl font-black tracking-tight mb-6">Grievance Redressal</h1>
          <p className="text-xl text-muted-foreground">
            In accordance with the Information Technology Act 2000 and the Consumer Protection (E-Commerce) Rules, 2020.
          </p>
        </div>

        <div className="bg-secondary/30 rounded-[3rem] border border-border overflow-hidden mb-12">
          <div className="p-10 lg:p-16 border-b border-border">
            <h2 className="text-3xl font-black mb-8">Nodal Grievance Officer</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
              <div className="space-y-8">
                <div className="flex gap-4">
                  <div className="w-12 h-12 bg-primary rounded-2xl flex items-center justify-center shrink-0">
                    <ShieldCheck className="w-6 h-6 text-primary-foreground" />
                  </div>
                  <div>
                    <div className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-1">Officer Name</div>
                    <div className="text-lg font-black">Mr. Kishore Kumar Mandava</div>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="w-12 h-12 bg-secondary rounded-2xl flex items-center justify-center shrink-0">
                    <Mail className="w-6 h-6 text-foreground" />
                  </div>
                  <div>
                    <div className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-1">Email Address</div>
                    <div className="text-lg font-black">martyzee.online@gmail.com</div>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="w-12 h-12 bg-secondary rounded-2xl flex items-center justify-center shrink-0">
                    <Phone className="w-6 h-6 text-foreground" />
                  </div>
                  <div>
                    <div className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-1">Contact Number</div>
                    <div className="text-lg font-black">+91 93928 49473</div>
                  </div>
                </div>
              </div>

              <div className="space-y-8">
                <div className="flex gap-4">
                  <div className="w-12 h-12 bg-secondary rounded-2xl flex items-center justify-center shrink-0">
                    <MapPin className="w-6 h-6 text-foreground" />
                  </div>
                  <div>
                    <div className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-1">Corporate Address</div>
                    <div className="text-lg font-black leading-relaxed">
                      plot no3,3a yadava nagar,<br />
                      near richmond villas, b road,<br />
                      kurnool 518001
                    </div>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="w-12 h-12 bg-secondary rounded-2xl flex items-center justify-center shrink-0">
                    <Clock className="w-6 h-6 text-foreground" />
                  </div>
                  <div>
                    <div className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-1">Working Hours</div>
                    <div className="text-lg font-black">Mon - Fri, 10:00 AM - 6:00 PM</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="p-10 lg:p-16 bg-primary/5">
            <h3 className="text-xl font-black mb-8">Raise a New Grievance</h3>
            <GrievanceForm />
          </div>
        </div>

        {/* Track Section */}
        <div className="bg-secondary/20 rounded-[3rem] p-10 lg:p-16 border border-border text-center mb-16">
          <h2 className="text-3xl font-black mb-4">Already have a Ticket ID?</h2>
          <p className="text-muted-foreground mb-10 max-w-xl mx-auto">
            Enter your unique grievance ID to check the current status and resolution details of your complaint.
          </p>
          <div className="max-w-md mx-auto">
            <TicketTracker />
          </div>
        </div>

        {/* Quick Links */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Terms", href: "/legal/terms" },
            { label: "Privacy", href: "/legal/privacy" },
            { label: "Refunds", href: "/legal/refund" },
            { label: "Shipping", href: "/legal/shipping" }
          ].map(link => (
            <Link 
              key={link.label} 
              href={link.href}
              className="p-6 bg-secondary/30 rounded-[2rem] text-center font-bold hover:bg-primary hover:text-primary-foreground transition-all"
            >
              {link.label}
            </Link>
          ))}
        </div>
      </div>
    </main>
  );
}
