"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Navbar from "@/components/layout/Navbar";
import { 
  User, 
  ShoppingBag, 
  Download, 
  Settings, 
  LogOut, 
  ChevronRight, 
  Zap,
  Star,
  FileText
} from "lucide-react";
import { auth, db } from "@/lib/firebase";
import { collection, query, where, orderBy, getDocs } from "firebase/firestore";
import { signOut } from "firebase/auth";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

type Tab = "overview" | "orders" | "library" | "settings" | "coupons" | "tickets";

export default function ProfilePage() {
  const { user, profile } = useAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<Tab>("overview");
  const [orders, setOrders] = useState<any[]>([]);
  const [coupons, setCoupons] = useState<any[]>([]);
  const [tickets, setTickets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      router.push("/");
      return;
    }

    const fetchData = async () => {
      try {
        // Fetch Orders
        const qOrders = query(
          collection(db, "orders"), 
          where("userId", "==", user.uid),
          orderBy("createdAt", "desc")
        );
        const orderSnap = await getDocs(qOrders);
        const orderData = orderSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setOrders(orderData);

        // Fetch Coupons
        const qCoupons = query(
          collection(db, "lucky_draw_entries"),
          where("userId", "==", user.uid),
          orderBy("createdAt", "desc")
        );
        const couponSnap = await getDocs(qCoupons);
        const couponData = couponSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setCoupons(couponData);

        // Fetch Tickets
        const qTickets = query(
          collection(db, "tickets"),
          where("userId", "==", user.uid),
          orderBy("createdAt", "desc")
        );
        const ticketSnap = await getDocs(qTickets);
        setTickets(ticketSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      } catch (err) {
        console.error("Fetch Data Error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user, router]);

  const handleSignOut = async () => {
    await signOut(auth);
    router.push("/");
  };

  if (!user || !profile) return null;

  return (
    <main className="min-h-screen bg-background">
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          
          {/* Sidebar */}
          <div className="lg:col-span-3 space-y-4">
            <div className="p-8 bg-secondary/30 rounded-[2.5rem] border border-border text-center mb-8">
              <div className="w-20 h-20 bg-primary rounded-3xl flex items-center justify-center mx-auto mb-4 text-primary-foreground font-black text-2xl">
                {profile.displayName?.[0] || user.phoneNumber?.[user.phoneNumber.length - 1]}
              </div>
              <h2 className="text-xl font-black truncate">{profile.displayName || "User"}</h2>
              <p className="text-xs text-muted-foreground font-bold mt-1 uppercase tracking-widest">{profile.role}</p>
            </div>

            <nav className="space-y-2">
              {[
                { id: "overview", label: "Overview", icon: User },
                { id: "library", label: "My Library", icon: Download },
                { id: "coupons", label: "Lucky Draw", icon: Zap },
                { id: "orders", label: "Order History", icon: ShoppingBag },
                { id: "tickets", label: "Grievances", icon: FileText },
                { id: "settings", label: "Settings", icon: Settings }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as Tab)}
                  className={cn(
                    "w-full flex items-center gap-4 px-6 py-4 rounded-2xl font-bold transition-all",
                    activeTab === tab.id 
                      ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20" 
                      : "hover:bg-secondary text-muted-foreground hover:text-foreground"
                  )}
                >
                  <tab.icon className="w-5 h-5" />
                  {tab.label}
                </button>
              ))}
              <button 
                onClick={handleSignOut}
                className="w-full flex items-center gap-4 px-6 py-4 rounded-2xl font-bold text-destructive hover:bg-destructive/10 transition-all mt-8"
              >
                <LogOut className="w-5 h-5" />
                Sign Out
              </button>
            </nav>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-9">
            {activeTab === "overview" && (
              <div className="space-y-8 animate-in">
                <div className="bg-primary text-primary-foreground rounded-[3rem] p-10 relative overflow-hidden shadow-2xl shadow-primary/20">
                  <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl"></div>
                  <div className="relative z-10">
                    <h1 className="text-4xl font-black mb-4">Hello, {profile.displayName}!</h1>
                    <p className="text-primary-foreground/70 max-w-md">
                      Welcome to your BYLYF account. Manage your digital assets, track your deliveries, and check your lucky draw entries here.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="bg-secondary/30 rounded-[2.5rem] border border-border p-8">
                    <div className="flex justify-between items-center mb-6">
                      <h3 className="text-xl font-black">Recent Assets</h3>
                      <button onClick={() => setActiveTab("library")} className="text-xs font-black text-primary uppercase tracking-widest hover:underline">View All</button>
                    </div>
                    <div className="space-y-4">
                      {orders.flatMap(o => o.items).filter(i => i.type === "digital").slice(0, 2).map((item, idx) => (
                        <div key={idx} className="p-4 bg-background rounded-2xl border border-border flex items-center gap-4 group cursor-pointer hover:border-primary/50 transition-all">
                          <div className="w-12 h-12 bg-primary/10 text-primary rounded-xl flex items-center justify-center">
                            <Zap className="w-6 h-6" />
                          </div>
                          <div className="flex-1">
                            <div className="font-bold text-sm">{item.title}</div>
                            <div className="text-[10px] text-muted-foreground uppercase font-black">Ready to download</div>
                          </div>
                        </div>
                      ))}
                      {orders.flatMap(o => o.items).filter(i => i.type === "digital").length === 0 && (
                        <div className="p-8 text-center text-muted-foreground text-sm italic">No digital assets found.</div>
                      )}
                    </div>
                  </div>

                  <div className="bg-secondary/30 rounded-[2.5rem] border border-border p-8">
                    <div className="flex justify-between items-center mb-6">
                      <h3 className="text-xl font-black">Lucky Draw Entries</h3>
                      <span className="text-xs font-black text-primary uppercase tracking-widest">Live Status</span>
                    </div>
                    <div className="p-6 bg-background rounded-2xl border border-dashed border-border text-center">
                      <p className="text-sm text-muted-foreground">Entries are processed based on your order history.</p>
                      <Link href="/#catalog" className="text-sm font-black text-primary hover:underline mt-2 inline-block">Shop now to enter the draw</Link>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "library" && (
              <div className="space-y-8 animate-in">
                <h2 className="text-3xl font-black tracking-tight">My Digital Library</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {orders.flatMap(o => o.items).filter(i => i.type === "digital").map((item, idx) => (
                    <div key={idx} className="bg-secondary/30 rounded-[2rem] border border-border overflow-hidden group">
                      <div className="aspect-video bg-background relative overflow-hidden">
                        <img src={item.image} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                          <Download className="w-10 h-10 text-white" />
                        </div>
                      </div>
                      <div className="p-6">
                        <h4 className="font-bold mb-4">{item.title}</h4>
                        <button className="w-full py-3 bg-primary text-primary-foreground rounded-xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2">
                          <Download className="w-4 h-4" /> Download Now
                        </button>
                      </div>
                    </div>
                  ))}
                  {orders.flatMap(o => o.items).filter(i => i.type === "digital").length === 0 && (
                    <div className="col-span-full py-20 text-center bg-secondary/20 rounded-[3rem] border-2 border-dashed border-border">
                      <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-muted-foreground font-bold">Your purchased digital content will appear here.</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === "orders" && (
              <div className="space-y-8 animate-in">
                <h2 className="text-3xl font-black tracking-tight">Order History</h2>
                <div className="space-y-4">
                  {orders.map((order) => (
                    <div key={order.id} className="bg-secondary/30 rounded-[2rem] border border-border p-6 md:p-8">
                      <div className="flex flex-col md:flex-row justify-between gap-6 mb-8 pb-8 border-b border-border">
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-8">
                          <div>
                            <div className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1">Order Date</div>
                            <div className="text-sm font-bold">{order.createdAt?.toDate().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</div>
                          </div>
                          <div>
                            <div className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1">Order Total</div>
                            <div className="text-sm font-black">₹{order.total.toLocaleString('en-IN')}</div>
                          </div>
                          <div>
                            <div className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1">Order ID</div>
                            <div className="text-sm font-bold font-mono uppercase">{order.id.slice(0, 8)}</div>
                          </div>
                        </div>
                        <div className="flex items-center">
                          <span className="px-4 py-2 bg-success/10 text-success rounded-full text-xs font-black uppercase tracking-widest">
                            {order.status}
                          </span>
                        </div>
                      </div>
                      
                      <div className="space-y-4">
                        {order.items.map((item: any, idx: number) => (
                          <div key={idx} className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                              <div className="w-12 h-12 bg-background rounded-xl overflow-hidden border border-border shrink-0">
                                <img src={item.image} alt="" className="w-full h-full object-cover" />
                              </div>
                              <div>
                                <div className="font-bold text-sm">{item.title}</div>
                                <div className="text-xs text-muted-foreground">Qty: {item.quantity}</div>
                              </div>
                            </div>
                            <div className="font-black text-sm">₹{(item.price * item.quantity).toLocaleString('en-IN')}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                  {orders.length === 0 && (
                    <div className="p-12 text-center bg-secondary/20 rounded-[3rem] border-2 border-dashed border-border">
                      <ShoppingBag className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-muted-foreground font-bold">You haven't placed any orders yet.</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === "coupons" && (
              <div className="space-y-8 animate-in">
                <div className="flex justify-between items-end">
                  <div>
                    <h2 className="text-3xl font-black tracking-tight">Lucky Draw Coupons</h2>
                    <p className="text-muted-foreground mt-2">All your active entries in the upcoming bumper draws.</p>
                  </div>
                  <div className="bg-primary/10 text-primary px-6 py-3 rounded-2xl border border-primary/20">
                    <div className="text-xs font-black uppercase tracking-widest opacity-60">Total Coupons</div>
                    <div className="text-2xl font-black">{coupons.length}</div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {coupons.map((coupon) => (
                    <div key={coupon.id} className="bg-secondary/30 rounded-[2rem] border border-border p-6 relative overflow-hidden group hover:border-primary/50 transition-all">
                      <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl group-hover:bg-primary/10 transition-all"></div>
                      
                      <div className="relative z-10">
                        <div className="flex justify-between items-start mb-6">
                          <div className="w-12 h-12 bg-background rounded-xl border border-border flex items-center justify-center text-primary">
                            <Zap className="w-6 h-6 fill-current" />
                          </div>
                          <span className="px-3 py-1 bg-success/10 text-success rounded-full text-[10px] font-black uppercase tracking-widest">
                            {coupon.status}
                          </span>
                        </div>

                        <div className="space-y-1 mb-6">
                          <div className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Coupon ID</div>
                          <div className="text-2xl font-black tracking-tighter text-primary">{coupon.couponId}</div>
                        </div>

                        <div className="pt-6 border-t border-border/50">
                          <div className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1">Linked Item</div>
                          <div className="text-sm font-bold truncate">{coupon.itemTitle}</div>
                          <div className="text-[10px] text-muted-foreground mt-2">Issued on {coupon.createdAt?.toDate().toLocaleDateString()}</div>
                        </div>
                      </div>
                    </div>
                  ))}

                  {coupons.length === 0 && (
                    <div className="col-span-full py-20 text-center bg-secondary/20 rounded-[3rem] border-2 border-dashed border-border">
                      <Zap className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-muted-foreground font-bold">No coupons found. Buy eligible items to enter!</p>
                      <Link href="/#catalog" className="mt-4 px-6 py-3 bg-primary text-primary-foreground rounded-xl font-black text-xs uppercase tracking-widest inline-block">Shop Eligible Products</Link>
                    </div>
                  )}
                </div>
              </div>
            )}


            
            {activeTab === "tickets" && (
              <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4">
                <div>
                  <h2 className="text-3xl font-black tracking-tight">My Grievances</h2>
                  <p className="text-muted-foreground mt-2">Track the status of your support requests and complaints.</p>
                </div>

                <div className="space-y-4">
                  {tickets.map((ticket) => (
                    <div key={ticket.id} className="p-8 bg-secondary/30 rounded-[2.5rem] border border-border group hover:border-primary/50 transition-all">
                      <div className="flex flex-col md:flex-row justify-between gap-6">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <span className="text-[10px] font-black uppercase tracking-widest text-primary font-mono">{ticket.ticketId}</span>
                            <span className={cn(
                              "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest",
                              ticket.status === "open" ? "bg-amber-500/10 text-amber-600" :
                              ticket.status === "resolved" ? "bg-success/10 text-success" : "bg-secondary text-muted-foreground"
                            )}>
                              {ticket.status}
                            </span>
                          </div>
                          <h3 className="text-xl font-black mb-2">{ticket.subject}</h3>
                          <p className="text-sm text-muted-foreground line-clamp-2 mb-6">{ticket.description}</p>
                          
                          <div className="p-4 bg-background/50 rounded-2xl border border-border/50">
                            <div className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1">Latest Update</div>
                            <div className="text-sm font-bold italic">
                              "{ticket.updates?.[ticket.updates.length - 1]?.note || "Awaiting initial review."}"
                            </div>
                          </div>
                        </div>
                        <div className="md:text-right flex flex-col justify-between shrink-0">
                          <div>
                            <div className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Category</div>
                            <div className="font-bold">{ticket.category}</div>
                          </div>
                          <div className="text-[10px] text-muted-foreground font-bold mt-4">
                            Last activity: {new Date(ticket.updatedAt?.toDate?.() || Date.now()).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}

                  {tickets.length === 0 && (
                    <div className="py-20 text-center bg-secondary/20 rounded-[3rem] border-2 border-dashed border-border">
                      <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-muted-foreground font-bold">You haven't raised any grievances yet.</p>
                      <Link href="/legal/grievance" className="mt-4 px-6 py-3 bg-primary text-primary-foreground rounded-xl font-black text-xs uppercase tracking-widest inline-block">Raise a Grievance</Link>
                    </div>
                  )}
                </div>
              </div>
            )}
            {activeTab === "settings" && (
              <div className="space-y-8 animate-in">
                <h2 className="text-3xl font-black tracking-tight">Account Settings</h2>
                <div className="max-w-xl space-y-6">
                  <div className="space-y-2">
                    <label className="text-sm font-bold ml-1">Display Name</label>
                    <input 
                      type="text" 
                      defaultValue={profile.displayName || ""}
                      className="w-full px-4 py-3.5 bg-secondary border border-border rounded-2xl outline-none"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold ml-1">Email Address</label>
                    <input 
                      type="email" 
                      defaultValue={profile.email || ""}
                      className="w-full px-4 py-3.5 bg-secondary border border-border rounded-2xl outline-none"
                    />
                  </div>
                  <button className="px-8 py-4 bg-primary text-primary-foreground rounded-2xl font-black">
                    Save Changes
                  </button>
                </div>
              </div>
            )}

          </div>
        </div>
      </div>
    </main>
  );
}
