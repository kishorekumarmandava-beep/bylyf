"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCartStore } from "@/store/useCartStore";
import Navbar from "@/components/layout/Navbar";
import { 
  Trash2, 
  Plus, 
  Minus, 
  ArrowRight, 
  ShoppingBag, 
  Zap, 
  ShieldCheck,
  ChevronLeft
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { db } from "@/lib/firebase";
import { collection, query, where, getDocs } from "firebase/firestore";

export default function CartPage() {
  const { items, removeItem, updateQuantity, getTotalPrice, getTotalItems } = useCartStore();
  const router = useRouter();
  
  // Hydration fix
  const [isLoaded, setIsLoaded] = useState(false);
  const [activeCampaign, setActiveCampaign] = useState<any>(null);
  const [checkingCampaign, setCheckingCampaign] = useState(true);

  useEffect(() => {
    setIsLoaded(true);
    const fetchCampaign = async () => {
      try {
        const q = query(collection(db, "campaigns"), where("status", "==", "active"));
        const snap = await getDocs(q);
        if (!snap.empty) {
          setActiveCampaign({ id: snap.docs[0].id, ...snap.docs[0].data() });
        }
      } catch (err) {
        console.error("Error fetching campaign for cart:", err);
      } finally {
        setCheckingCampaign(false);
      }
    };
    fetchCampaign();
  }, []);

  if (!isLoaded) return null;

  const subtotal = getTotalPrice();
  const drawThreshold = activeCampaign?.minSpendForCoupon || 999;
  const isEligibleForDraw = subtotal >= drawThreshold;
  const progressToDraw = Math.min((subtotal / drawThreshold) * 100, 100);
  const hasEligibleItems = items.some(item => item.luckyDrawEligible);

  if (items.length === 0) {
    return (
      <main className="min-h-screen bg-background">
        <Navbar />
        <div className="max-w-7xl mx-auto px-4 py-20 text-center">
          <div className="w-24 h-24 bg-secondary rounded-[2rem] flex items-center justify-center mx-auto mb-8">
            <ShoppingBag className="w-10 h-10 text-muted-foreground" />
          </div>
          <h1 className="text-4xl font-black mb-4">Your cart is empty</h1>
          <p className="text-muted-foreground mb-12 text-lg">Looks like you haven't added anything to your cart yet.</p>
          <Link 
            href="/#catalog"
            className="px-8 py-4 bg-primary text-primary-foreground rounded-2xl font-bold inline-flex items-center gap-2 hover:scale-105 transition-transform"
          >
            Start Shopping
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-background">
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex flex-col lg:flex-row gap-12">
          {/* Left: Cart Items */}
          <div className="lg:flex-1">
            <div className="flex items-center justify-between mb-8">
              <h1 className="text-4xl font-black tracking-tight">Shopping Bag</h1>
              <span className="text-muted-foreground font-bold">{getTotalItems()} Items</span>
            </div>

            <div className="space-y-6">
              <AnimatePresence>
                {items.map((item) => (
                  <motion.div 
                    key={`${item.id}-${item.selectedSize || ""}-${item.selectedColor || ""}`}
                    layout
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="group bg-secondary/30 rounded-[2.5rem] border border-border p-6 flex items-center gap-6 hover:bg-secondary/50 transition-colors"
                  >
                    <div className="w-24 h-24 bg-background rounded-2xl overflow-hidden shrink-0 border border-border">
                      <img src={item.images[0]} alt={item.title} className="w-full h-full object-cover" />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start gap-4">
                        <div>
                          <h3 className="text-lg font-bold truncate group-hover:text-primary transition-colors">{item.title}</h3>
                          <p className="text-xs text-muted-foreground uppercase tracking-widest font-bold mt-1">
                            {item.brand} • {item.type}
                            {(item.selectedSize || item.selectedColor) && (
                              <span className="text-primary font-black ml-2 uppercase">
                                {item.selectedSize && `[Size: ${item.selectedSize}]`}
                                {item.selectedSize && item.selectedColor && " "}
                                {item.selectedColor && `[Color: ${item.selectedColor}]`}
                              </span>
                            )}
                          </p>
                        </div>
                        <button 
                          onClick={() => removeItem(item.id, item.selectedSize, item.selectedColor)}
                          className="p-2 text-muted-foreground hover:text-destructive transition-colors"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>

                      <div className="flex items-center justify-between mt-6">
                        <div className="flex items-center gap-4 bg-background rounded-xl p-1 border border-border">
                          <button 
                            onClick={() => updateQuantity(item.id, Math.max(1, item.quantity - 1), item.selectedSize, item.selectedColor)}
                            className="p-1.5 hover:bg-secondary rounded-lg transition-colors"
                          >
                            <Minus className="w-4 h-4" />
                          </button>
                          <span className="text-sm font-black w-4 text-center">{item.quantity}</span>
                          <button 
                            onClick={() => updateQuantity(item.id, item.quantity + 1, item.selectedSize, item.selectedColor)}
                            className="p-1.5 hover:bg-secondary rounded-lg transition-colors"
                          >
                            <Plus className="w-4 h-4" />
                          </button>
                        </div>
                        <div className="text-xl font-black">
                          ₹{(item.sellingPrice * item.quantity).toLocaleString('en-IN')}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>

            <Link 
              href="/#catalog"
              className="mt-8 inline-flex items-center gap-2 text-sm font-bold text-muted-foreground hover:text-primary transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
              Continue Shopping
            </Link>
          </div>

          {/* Right: Summary */}
          <div className="lg:w-96">
            <div className="sticky top-32 space-y-6">
              {/* Lucky Draw Card */}
              {activeCampaign && hasEligibleItems && (
                <div className="bg-primary text-primary-foreground rounded-[3rem] p-8 shadow-2xl shadow-primary/20 relative overflow-hidden">
                  <div className="absolute -top-4 -right-4 w-24 h-24 bg-white/10 rounded-full blur-2xl"></div>
                  <div className="relative z-10">
                    <div className="flex items-center gap-2 mb-4">
                      <Zap className="w-6 h-6 fill-current" />
                      <h3 className="font-black uppercase tracking-widest text-sm">Lucky Draw Status</h3>
                    </div>
                    
                    {isEligibleForDraw ? (
                      <div className="space-y-4">
                        <p className="text-2xl font-black leading-tight">Congrats! You're in the Bumper Draw.</p>
                        <div className="h-2 bg-white/20 rounded-full overflow-hidden">
                          <div className="h-full bg-white w-full"></div>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <p className="text-lg font-bold leading-tight">
                          Add ₹{(drawThreshold - subtotal).toLocaleString('en-IN')} more to enter the Lucky Draw!
                        </p>
                        <div className="h-2 bg-white/20 rounded-full overflow-hidden">
                          <div className="h-full bg-white transition-all duration-500" style={{ width: `${progressToDraw}%` }}></div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Order Summary */}
              <div className="bg-secondary/30 rounded-[2.5rem] border border-border p-8">
                <h2 className="text-2xl font-black mb-6">Order Summary</h2>
                
                <div className="space-y-4 mb-8">
                  <div className="flex justify-between text-muted-foreground font-medium">
                    <span>Subtotal</span>
                    <span>₹{subtotal.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between text-muted-foreground font-medium">
                    <span>Shipping</span>
                    <span className="text-success font-bold uppercase tracking-widest text-xs">Calculated at checkout</span>
                  </div>
                  <div className="flex justify-between text-muted-foreground font-medium">
                    <span>GST (Included)</span>
                    <span>Inclusive</span>
                  </div>
                  <div className="pt-4 border-t border-border flex justify-between items-end">
                    <div>
                      <div className="text-xs font-black uppercase tracking-widest text-muted-foreground mb-1">Total Amount</div>
                      <div className="text-3xl font-black">₹{subtotal.toLocaleString('en-IN')}</div>
                    </div>
                  </div>
                </div>

                <button 
                  onClick={() => router.push("/checkout")}
                  className="w-full py-5 bg-primary text-primary-foreground rounded-2xl font-black shadow-2xl shadow-primary/30 hover:scale-[1.02] transition-all flex items-center justify-center gap-2 group"
                >
                  PROCEED TO CHECKOUT
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </button>

                <div className="mt-8 flex items-center justify-center gap-4 text-muted-foreground">
                  <ShieldCheck className="w-5 h-5" />
                  <span className="text-[10px] font-black uppercase tracking-widest">Secure Checkout</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
