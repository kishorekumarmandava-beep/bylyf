"use client";

import React, { useState } from "react";
import Navbar from "@/components/layout/Navbar";
import { 
  Search, 
  MapPin, 
  Clock, 
  CheckCircle2, 
  Truck, 
  Package, 
  AlertCircle,
  Phone,
  Hash
} from "lucide-react";
import { db } from "@/lib/firebase";
import { doc, getDoc, getDocs, collection, query, where } from "firebase/firestore";
import { cn } from "@/lib/utils";

type OrderStatus = "paid" | "processing" | "shipped" | "delivered" | "cancelled";

export default function OrderTrackingPage() {
  const [orderId, setOrderId] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [loading, setLoading] = useState(false);
  const [searchError, setSearchError] = useState("");
  const [order, setOrder] = useState<any>(null);

  const handleTrack = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!orderId.trim() || !phoneNumber.trim()) {
      setSearchError("Please enter both Order ID and Phone Number.");
      return;
    }

    setLoading(true);
    setSearchError("");
    setOrder(null);

    const searchId = orderId.trim();
    let foundOrder: any = null;

    try {
      // 1. Try matching by full Firestore Document ID
      try {
        const docRef = doc(db, "orders", searchId);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          foundOrder = { id: docSnap.id, ...docSnap.data() };
        }
      } catch (e) {}

      // 2. Try matching by Razorpay orderId
      if (!foundOrder) {
        const qRazor = query(collection(db, "orders"), where("orderId", "==", searchId));
        const snap = await getDocs(qRazor);
        if (!snap.empty) {
          foundOrder = { id: snap.docs[0].id, ...snap.docs[0].data() };
        }
      }

      // 3. Try matching by 8-character Firestore ID prefix
      if (!foundOrder && searchId.length === 8) {
        const snap = await getDocs(collection(db, "orders"));
        const match = snap.docs.find(d => d.id.slice(0, 8).toUpperCase() === searchId.toUpperCase());
        if (match) {
          foundOrder = { id: match.id, ...match.data() };
        }
      }

      if (!foundOrder) {
        setSearchError("No order found with the provided Order ID.");
        setLoading(false);
        return;
      }

      // 4. Verify Phone Number (compare last 10 digits to avoid country code issues)
      const dbPhone = foundOrder.shippingAddress?.phone?.replace(/[^0-9]/g, "") || "";
      const inputPhone = phoneNumber.replace(/[^0-9]/g, "");

      const dbPhoneLast10 = dbPhone.slice(-10);
      const inputPhoneLast10 = inputPhone.slice(-10);

      if (dbPhoneLast10 !== inputPhoneLast10) {
        setSearchError("Verification failed. The phone number does not match this order.");
        setLoading(false);
        return;
      }

      setOrder(foundOrder);
    } catch (err) {
      console.error("Tracking error:", err);
      setSearchError("An error occurred while tracking the order. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const getStatusSteps = (status: OrderStatus) => {
    const steps = [
      { id: "paid", label: "Payment Confirmed", icon: CheckCircle2 },
      { id: "processing", label: "Processing", icon: Package },
      { id: "shipped", label: "Shipped", icon: Truck },
      { id: "delivered", label: "Delivered", icon: CheckCircle2 }
    ];

    const statusIndex = ["paid", "processing", "shipped", "delivered"].indexOf(status);
    
    // Default to index 1 (processing) if status is custom or just paid
    const currentStepIndex = statusIndex !== -1 ? statusIndex : 1;

    return steps.map((step, idx) => {
      const isCompleted = idx < currentStepIndex || status === "delivered";
      const isActive = idx === currentStepIndex && status !== "delivered";
      return {
        ...step,
        isCompleted,
        isActive
      };
    });
  };

  return (
    <main className="min-h-screen bg-background">
      <Navbar />

      <div className="max-w-4xl mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h1 className="text-5xl font-black tracking-tight mb-4">Track Your Order</h1>
          <p className="text-muted-foreground text-lg">Enter your order details below to see shipment and tracking progress.</p>
        </div>

        {/* Search Card */}
        <div className="bg-secondary/30 rounded-[3rem] border border-border p-8 md:p-12 mb-12 max-w-2xl mx-auto">
          <form onSubmit={handleTrack} className="space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-bold ml-1 flex items-center gap-1.5 text-muted-foreground">
                <Hash className="w-4 h-4" /> Order ID
              </label>
              <input 
                type="text" 
                placeholder="e.g., c9a8b7d6 or order_xyz123" 
                value={orderId}
                onChange={(e) => setOrderId(e.target.value)}
                className="w-full px-6 py-4 bg-background border border-border rounded-2xl outline-none focus:ring-2 focus:ring-primary font-bold transition-all text-center uppercase"
                required
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold ml-1 flex items-center gap-1.5 text-muted-foreground">
                <Phone className="w-4 h-4" /> Phone Number
              </label>
              <input 
                type="tel" 
                placeholder="Enter 10-digit mobile number" 
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                className="w-full px-6 py-4 bg-background border border-border rounded-2xl outline-none focus:ring-2 focus:ring-primary font-bold transition-all text-center"
                required
              />
            </div>

            {searchError && (
              <div className="p-4 bg-destructive/10 border border-destructive/20 text-destructive rounded-2xl font-bold flex items-center gap-2 text-sm justify-center">
                <AlertCircle className="w-5 h-5 shrink-0" />
                <span>{searchError}</span>
              </div>
            )}

            <button 
              type="submit"
              disabled={loading}
              className="w-full py-5 bg-primary text-primary-foreground rounded-2xl font-bold text-lg shadow-xl shadow-primary/20 hover:scale-[1.01] active:scale-95 transition-all disabled:opacity-50"
            >
              {loading ? "Searching Ledger..." : "Track Shipment"}
            </button>
          </form>
        </div>

        {/* Results Card */}
        {order && (
          <div className="bg-secondary/30 rounded-[3rem] border border-border p-8 md:p-12 space-y-12 animate-in">
            {/* Status Steps Tracker */}
            <div className="relative">
              <div className="absolute top-1/2 left-0 right-0 h-1 bg-border -translate-y-1/2 hidden md:block z-0"></div>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-8 relative z-10">
                {getStatusSteps(order.status).map((step, idx) => (
                  <div key={idx} className="flex flex-col items-center text-center">
                    <div className={cn(
                      "w-12 h-12 rounded-full border-2 flex items-center justify-center transition-all bg-background",
                      step.isCompleted ? "border-success text-success bg-success/5" :
                      step.isActive ? "border-primary text-primary animate-pulse" : "border-border text-muted-foreground"
                    )}>
                      <step.icon className="w-6 h-6" />
                    </div>
                    <span className={cn(
                      "text-xs font-black uppercase tracking-widest mt-3",
                      step.isCompleted ? "text-success" :
                      step.isActive ? "text-primary" : "text-muted-foreground"
                    )}>
                      {step.label}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Shipment Summary */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-8 border-t border-border">
              <div>
                <h3 className="text-xl font-black mb-4">Shipment Details</h3>
                <div className="space-y-4 text-sm font-medium">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Order Date</span>
                    <span>{order.createdAt?.toDate().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Order ID</span>
                    <span className="font-mono uppercase">{order.id}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Payment ID</span>
                    <span className="font-mono text-muted-foreground">{order.paymentId || "Online"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Courier Partner</span>
                    <span className="font-bold text-primary">
                      {order.courierPartner || (order.items.some((i: any) => i.type === "physical") ? "In-House Delivery" : "Instant Delivery")}
                    </span>
                  </div>
                  {order.trackingNumber && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Tracking Number</span>
                      <span className="font-bold text-primary">{order.trackingNumber}</span>
                    </div>
                  )}
                </div>
              </div>

              <div>
                <h3 className="text-xl font-black mb-4 flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-primary" /> Delivery Address
                </h3>
                <div className="p-6 bg-background rounded-3xl border border-border text-sm leading-relaxed">
                  <div className="font-bold text-base mb-1">{order.shippingAddress?.fullName}</div>
                  <div>{order.shippingAddress?.addressLine}</div>
                  <div>{order.shippingAddress?.city}, {order.shippingAddress?.state} - {order.shippingAddress?.pincode}</div>
                  <div className="mt-2 text-xs font-bold text-muted-foreground">Phone: {order.shippingAddress?.phone}</div>
                </div>
              </div>
            </div>

            {/* Items Summary */}
            <div>
              <h3 className="text-xl font-black mb-6">Items In Shipment</h3>
              <div className="space-y-4 bg-background rounded-[2rem] border border-border p-6 md:p-8">
                {order.items.map((item: any, idx: number) => (
                  <div key={idx} className="flex items-center justify-between py-2 border-b border-border/40 last:border-b-0">
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 bg-secondary rounded-xl overflow-hidden shrink-0">
                        <img src={item.image} alt="" className="w-full h-full object-cover" />
                      </div>
                      <div>
                        <div className="font-bold text-sm">{item.title}</div>
                        <div className="text-xs text-muted-foreground flex items-center gap-2">
                          <span>Qty: {item.quantity}</span>
                          {(item.selectedSize || item.selectedColor) && (
                            <span className="text-[10px] text-primary font-black uppercase">
                              {item.selectedSize && `Size: ${item.selectedSize}`}
                              {item.selectedSize && item.selectedColor && " | "}
                              {item.selectedColor && `Color: ${item.selectedColor}`}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="font-black text-sm">₹{(item.price * item.quantity).toLocaleString('en-IN')}</div>
                  </div>
                ))}

                <div className="flex justify-between items-end pt-6 border-t border-border">
                  <span className="text-sm font-black uppercase tracking-widest">Total Paid</span>
                  <span className="text-2xl font-black text-primary">₹{order.total.toLocaleString('en-IN')}</span>
                </div>
              </div>
            </div>

            {/* Support Message */}
            <div className="p-6 bg-primary/5 rounded-3xl border border-primary/10 flex items-center gap-4">
              <Clock className="w-6 h-6 text-primary shrink-0" />
              <p className="text-xs font-semibold text-muted-foreground leading-relaxed">
                For physical products, standard transit time is 3-5 business days. For digital products or queries regarding lucky draw entries, please contact support via the Help Center or raise a grievance in your profile dashboard.
              </p>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
