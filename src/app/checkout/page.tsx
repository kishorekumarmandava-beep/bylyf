"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useCartStore } from "@/store/useCartStore";
import { useAuth } from "@/context/AuthContext";
import Navbar from "@/components/layout/Navbar";
import { 
  MapPin, 
  CreditCard, 
  ShieldCheck, 
  ChevronRight, 
  ArrowLeft,
  ArrowRight,
  Truck,
  Info,
  Clock
} from "lucide-react";
import { db } from "@/lib/firebase";
import { collection, addDoc, serverTimestamp, updateDoc, doc, query, where, getDocs, getDoc } from "firebase/firestore";
import { mockProducts } from "@/data/mockProducts";
import toast from "react-hot-toast";
import { cn } from "@/lib/utils";

const INDIAN_STATES = [
  "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh", 
  "Goa", "Gujarat", "Haryana", "Himachal Pradesh", "Jharkhand", "Karnataka", 
  "Kerala", "Madhya Pradesh", "Maharashtra", "Manipur", "Meghalaya", "Mizoram", 
  "Nagaland", "Odisha", "Punjab", "Rajasthan", "Sikkim", "Tamil Nadu", 
  "Telangana", "Tripura", "Uttar Pradesh", "Uttarakhand", "West Bengal",
  "Delhi", "Puducherry", "Chandigarh", "Ladakh", "Jammu and Kashmir"
];

const STORE_STATE = "Telangana"; // Default store location for tax calculation

export default function CheckoutPage() {
  const { items, getTotalPrice, clearCart } = useCartStore();
  const { user } = useAuth();
  const router = useRouter();

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);

  // Form State
  const [address, setAddress] = useState({
    fullName: "",
    phone: "",
    addressLine: "",
    city: "",
    state: "Telangana",
    pincode: "",
  });

  const [couponCode, setCouponCode] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<any>(null);
  const [userCouponCount, setUserCouponCount] = useState(0);

  useEffect(() => {
    if (user) {
      // Check how many coupons this user has already used
      const checkCouponUsage = async () => {
        const q = query(collection(db, "orders"), where("userId", "==", user.uid));
        const snapshot = await getDocs(q);
        // Count orders where a coupon was used
        const count = snapshot.docs.filter(doc => doc.data().appliedCoupon).length;
        setUserCouponCount(count);
      };
      checkCouponUsage();
    }
    
    if (items.length === 0) {
      router.push("/cart");
    }
  }, [items, router, user]);

  const handleApplyCoupon = async () => {
    if (userCouponCount >= 6) {
      toast.error("You have already reached the maximum limit of 6 coupons per user.");
      return;
    }

    try {
      const q = query(collection(db, "coupons"), where("code", "==", couponCode), where("status", "==", "active"));
      const snapshot = await getDocs(q);
      
      if (snapshot.empty) {
        toast.error("Invalid or expired coupon code");
        return;
      }

      const couponData = snapshot.docs[0].data();
      setAppliedCoupon({ id: snapshot.docs[0].id, ...couponData });
      toast.success("₹500 Discount Applied!");
    } catch (err) {
      toast.error("Failed to validate coupon");
    }
  };

  const subtotal = getTotalPrice();
  const discount = appliedCoupon ? 500 : 0;
  
  // Tax Calculation Logic
  const calculateTax = () => {
    const isInterState = address.state !== STORE_STATE;
    const totalTax = items.reduce((acc, item) => {
      const itemTotal = item.sellingPrice * item.quantity;
      // Reverse calculate tax from inclusive price: Price - (Price / (1 + Rate/100))
      const taxAmount = itemTotal - (itemTotal / (1 + item.gstRate / 100));
      return acc + taxAmount;
    }, 0);

    if (isInterState) {
      return { igst: totalTax, cgst: 0, sgst: 0 };
    } else {
      return { igst: 0, cgst: totalTax / 2, sgst: totalTax / 2 };
    }
  };

  const taxBreakdown = calculateTax();
  const shipping = subtotal > 5000 ? 0 : 99;
  const grandTotal = Math.max(0, subtotal - discount + shipping);

  const handleNextStep = (e: React.FormEvent) => {
    e.preventDefault();
    if (step === 1) {
      if (!address.fullName || !address.phone || !address.addressLine || !address.pincode) {
        toast.error("Please fill all shipping details");
        return;
      }
      setStep(2);
    }
  };

  const loadRazorpayScript = () => {
    return new Promise((resolve) => {
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const handlePlaceOrder = async () => {
    setLoading(true);
    try {
      const res = await loadRazorpayScript();

      if (!res) {
        toast.error("Razorpay SDK failed to load. Check your internet connection.");
        setLoading(false);
        return;
      }

      // 1. Create order on server
      const response = await fetch("/api/checkout/razorpay", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: grandTotal,
          receipt: `rcpt_${Date.now()}`,
        }),
      });

      const orderDataResponse = await response.json();
      console.log("Order Creation Response:", orderDataResponse);

      if (!response.ok) {
        throw new Error(orderDataResponse.error || `Failed to create order (Status: ${response.status})`);
      }

      // 2. Open Razorpay Checkout
      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        amount: orderDataResponse.amount,
        currency: orderDataResponse.currency,
        name: "BYLYF Store",
        description: "Order Payment",
        order_id: orderDataResponse.id,
        handler: async function (razorResponse: any) {
          try {
            // 3. Mark coupon as redeemed if applicable
            if (appliedCoupon) {
              await updateDoc(doc(db, "coupons", appliedCoupon.id), {
                status: "redeemed",
                redeemedBy: user?.uid,
                redeemedAt: serverTimestamp()
              });
            }

            // 4. Calculate Lucky Draw Coupons & Agent Commission
            const agentConfigSnap = await getDoc(doc(db, "settings", "agent_config"));
            const agentConfig = agentConfigSnap.exists() ? agentConfigSnap.data() : { commissionType: 'fixed', commissionValue: 500, minSpendForCoupon: 2500 };
            
            let generatedCouponIds: string[] = [];
            if (grandTotal >= 2500) {
              const eligibleItems = items.filter(i => {
                const product = mockProducts.find(p => p.id === i.id);
                return product?.luckyDrawEligible;
              });

              for (const item of eligibleItems) {
                for (let j = 0; j < item.quantity; j++) {
                  const couponId = `BY-${Math.floor(10000 + Math.random() * 90000)}`;
                  generatedCouponIds.push(couponId);
                  
                  // Save to Firestore
                  await addDoc(collection(db, "lucky_draw_entries"), {
                    couponId,
                    userId: user?.uid,
                    orderId: razorResponse.razorpay_order_id,
                    itemTitle: item.title,
                    status: "active",
                    createdAt: serverTimestamp()
                  });
                }
              }
            }
            
            const couponsEarned = generatedCouponIds.length;
            
            let commissionEarned = 0;
            const referralCode = localStorage.getItem("bylyf_referral_code");

            if (couponsEarned > 0 && referralCode) {
              if (agentConfig.commissionType === "fixed") {
                commissionEarned = agentConfig.commissionValue;
              } else {
                commissionEarned = (grandTotal * agentConfig.commissionValue) / 100;
              }
            }

            // 5. Save Order to Firestore
            const finalOrderData = {
              userId: user?.uid,
              items: items.map(i => ({
                id: i.id,
                title: i.title,
                quantity: i.quantity,
                price: i.sellingPrice,
                type: i.type,
                image: i.images[0]
              })),
              subtotal,
              discount,
              appliedCoupon: appliedCoupon ? appliedCoupon.code : null,
              total: grandTotal,
              shippingAddress: address,
              couponsEarned,
              couponIds: generatedCouponIds,
              referralCode: referralCode || null,
              agentCommission: commissionEarned,
              paymentId: razorResponse.razorpay_payment_id,
              orderId: razorResponse.razorpay_order_id,
              status: "paid",
              createdAt: serverTimestamp(),
            };

            await addDoc(collection(db, "orders"), finalOrderData);
            
            // 6. Trigger WhatsApp Notifications (via API)
            try {
              let agentDetails = null;
              if (referralCode) {
                const agentQ = query(collection(db, "users"), where("uid", "==", referralCode)); // Assuming referralCode is uid.slice(0,8)
                // Note: In production, we'd query by a specific 'referralCode' field
                const agentSnap = await getDocs(agentQ);
                if (!agentSnap.empty) {
                  agentDetails = agentSnap.docs[0].data();
                }
              }

              await fetch("/api/whatsapp/notify", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  type: "ORDER_CONFIRMATION",
                  data: {
                    customerPhone: address.phone,
                    customerName: address.fullName,
                    orderId: razorResponse.razorpay_order_id,
                    couponsEarned,
                    couponIds: generatedCouponIds,
                    grandTotal,
                    agentPhone: agentDetails?.phoneNumber,
                    agentName: agentDetails?.displayName,
                    commissionAmount: commissionEarned
                  }
                })
              });
            } catch (notifyErr) {
              console.error("Notification Error:", notifyErr);
            }

            // 7. Trigger Shiprocket Integration (Physical Items Only)
            const physicalItems = items.filter(i => i.type === "physical");
            if (physicalItems.length > 0) {
              try {
                await fetch("/api/shipping/create-order", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    orderId: razorResponse.razorpay_order_id,
                    customerName: address.fullName,
                    email: user?.email,
                    phone: address.phone,
                    address: address.addressLine,
                    city: address.city,
                    pincode: address.pincode,
                    state: address.state,
                    items: physicalItems,
                    total: grandTotal
                  })
                });
              } catch (shipErr) {
                console.error("Shipping Integration Error:", shipErr);
                // Don't block user flow
              }
            }

            // Clean up referral
            localStorage.removeItem("bylyf_referral_code");
            
            toast.success("Payment Successful! Order Placed.");
            clearCart();
            router.push("/profile");
          } catch (err) {
            console.error("Order Save Error:", err);
            toast.error("Payment successful, but failed to save record.");
          }
        },
        prefill: {
          name: address.fullName,
          email: user?.email || "",
          contact: address.phone,
        },
        theme: {
          color: "#000000",
        },
      };

      const paymentObject = new (window as any).Razorpay(options);
      paymentObject.open();

    } catch (error: any) {
      console.error("Payment Error:", error);
      toast.error(error.message || "Payment failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-background">
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex flex-col lg:flex-row gap-12">
          
          {/* Left Side: Forms */}
          <div className="lg:flex-1">
            {/* Steps Indicator */}
            <div className="flex items-center gap-4 mb-12">
              <div className={cn("flex items-center gap-2", step >= 1 ? "text-primary" : "text-muted-foreground")}>
                <span className="w-8 h-8 rounded-full border-2 border-current flex items-center justify-center font-bold text-sm">1</span>
                <span className="font-bold">Shipping</span>
              </div>
              <ChevronRight className="w-4 h-4 text-muted-foreground" />
              <div className={cn("flex items-center gap-2", step >= 2 ? "text-primary" : "text-muted-foreground")}>
                <span className="w-8 h-8 rounded-full border-2 border-current flex items-center justify-center font-bold text-sm">2</span>
                <span className="font-bold">Payment</span>
              </div>
            </div>

            {step === 1 ? (
              <form onSubmit={handleNextStep} className="space-y-8 animate-in">
                <div className="bg-secondary/30 rounded-[2.5rem] border border-border p-8">
                  <h2 className="text-2xl font-black mb-6 flex items-center gap-3">
                    <MapPin className="w-6 h-6 text-primary" />
                    Shipping Address
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-sm font-bold ml-1">Full Name</label>
                      <input 
                        type="text"
                        value={address.fullName}
                        onChange={(e) => setAddress({...address, fullName: e.target.value})}
                        className="w-full px-4 py-3.5 bg-background border border-border rounded-2xl focus:ring-2 focus:ring-primary outline-none transition-all"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-bold ml-1">Phone Number</label>
                      <input 
                        type="tel"
                        value={address.phone}
                        onChange={(e) => setAddress({...address, phone: e.target.value})}
                        className="w-full px-4 py-3.5 bg-background border border-border rounded-2xl focus:ring-2 focus:ring-primary outline-none transition-all"
                        required
                      />
                    </div>
                    <div className="md:col-span-2 space-y-2">
                      <label className="text-sm font-bold ml-1">Full Address</label>
                      <textarea 
                        rows={3}
                        value={address.addressLine}
                        onChange={(e) => setAddress({...address, addressLine: e.target.value})}
                        className="w-full px-4 py-3.5 bg-background border border-border rounded-2xl focus:ring-2 focus:ring-primary outline-none transition-all"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-bold ml-1">City</label>
                      <input 
                        type="text"
                        value={address.city}
                        onChange={(e) => setAddress({...address, city: e.target.value})}
                        className="w-full px-4 py-3.5 bg-background border border-border rounded-2xl focus:ring-2 focus:ring-primary outline-none transition-all"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-bold ml-1">State</label>
                      <select 
                        value={address.state}
                        onChange={(e) => setAddress({...address, state: e.target.value})}
                        className="w-full px-4 py-3.5 bg-background border border-border rounded-2xl focus:ring-2 focus:ring-primary outline-none transition-all"
                      >
                        {INDIAN_STATES.map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-bold ml-1">Pincode</label>
                      <input 
                        type="text"
                        value={address.pincode}
                        onChange={(e) => setAddress({...address, pincode: e.target.value})}
                        className="w-full px-4 py-3.5 bg-background border border-border rounded-2xl focus:ring-2 focus:ring-primary outline-none transition-all"
                        maxLength={6}
                        required
                      />
                    </div>
                  </div>
                </div>

                <button 
                  type="submit"
                  className="w-full py-5 bg-primary text-primary-foreground rounded-2xl font-black shadow-2xl shadow-primary/30 hover:scale-[1.02] transition-all flex items-center justify-center gap-2"
                >
                  Continue to Payment
                  <ArrowRight className="w-5 h-5" />
                </button>
              </form>
            ) : (
              <div className="space-y-8 animate-in">
                <div className="bg-secondary/30 rounded-[2.5rem] border border-border p-8">
                  <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-black flex items-center gap-3">
                      <CreditCard className="w-6 h-6 text-primary" />
                      Payment Method
                    </h2>
                    <button onClick={() => setStep(1)} className="text-sm font-bold text-primary hover:underline flex items-center gap-1">
                      <ArrowLeft className="w-4 h-4" /> Change Address
                    </button>
                  </div>

                  <div className="p-6 bg-background rounded-3xl border border-primary/20 flex items-center justify-between mb-8">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center">
                        <CreditCard className="w-6 h-6 text-primary" />
                      </div>
                      <div>
                        <div className="font-bold">Online Payment</div>
                        <div className="text-xs text-muted-foreground uppercase tracking-widest font-bold">UPI, Cards, Netbanking</div>
                      </div>
                    </div>
                    <div className="w-6 h-6 rounded-full border-4 border-primary flex items-center justify-center">
                      <div className="w-2.5 h-2.5 bg-primary rounded-full"></div>
                    </div>
                  </div>

                  <div className="p-6 bg-secondary/30 rounded-3xl border border-dashed border-border text-center">
                    <p className="text-sm text-muted-foreground">Secure payment gateway powered by Razorpay</p>
                  </div>
                </div>

                <button 
                  onClick={handlePlaceOrder}
                  disabled={loading}
                  className="w-full py-5 bg-primary text-primary-foreground rounded-2xl font-black shadow-2xl shadow-primary/30 hover:scale-[1.02] transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {loading ? "Processing..." : `Pay ₹${grandTotal.toLocaleString('en-IN')}`}
                  <ShieldCheck className="w-6 h-6" />
                </button>
              </div>
            )}
          </div>

          {/* Right Side: Order Summary */}
          <div className="lg:w-96">
            <div className="sticky top-32 bg-background rounded-[2.5rem] border border-border p-8 shadow-xl">
              <h2 className="text-2xl font-black mb-6">Your Order</h2>
              
              <div className="space-y-4 mb-8 max-h-60 overflow-y-auto pr-2 scrollbar-hide">
                {items.map(item => (
                  <div key={item.id} className="flex gap-4">
                    <div className="w-16 h-16 bg-secondary rounded-xl overflow-hidden shrink-0">
                      <img src={item.images[0]} alt="" className="w-full h-full object-cover" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-bold truncate">{item.title}</div>
                      <div className="text-xs text-muted-foreground">Qty: {item.quantity}</div>
                      <div className="text-sm font-black mt-1">₹{(item.sellingPrice * item.quantity).toLocaleString('en-IN')}</div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="space-y-3 pt-6 border-t border-border">
                {/* Coupon Section */}
                <div className="mb-6">
                  <div className="text-xs font-black uppercase tracking-widest text-muted-foreground mb-2">Have a Storefront Coupon?</div>
                  <div className="flex gap-2">
                    <input 
                      type="text" 
                      placeholder="BY-XXXX-XXXX"
                      value={couponCode}
                      onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                      className="flex-1 px-4 py-2 bg-secondary/50 border border-border rounded-xl text-xs font-bold outline-none"
                    />
                    <button 
                      onClick={handleApplyCoupon}
                      className="px-4 py-2 bg-primary text-primary-foreground rounded-xl text-[10px] font-black uppercase tracking-widest"
                    >
                      Apply
                    </button>
                  </div>
                  {appliedCoupon && (
                    <div className="mt-2 text-[10px] font-black text-success uppercase tracking-widest flex items-center gap-1">
                      <ShieldCheck className="w-3 h-3" /> ₹500 Discount Applied
                    </div>
                  )}
                </div>

                <div className="flex justify-between text-sm font-medium text-muted-foreground">
                  <span>Subtotal</span>
                  <span>₹{subtotal.toLocaleString('en-IN')}</span>
                </div>
                {discount > 0 && (
                  <div className="flex justify-between text-sm font-medium text-success">
                    <span>Storefront Discount</span>
                    <span>-₹{discount.toLocaleString('en-IN')}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm font-medium text-muted-foreground">
                  <span>Shipping</span>
                  <span>{shipping === 0 ? "FREE" : `₹${shipping}`}</span>
                </div>
                
                {/* GST Details */}
                <div className="space-y-1 py-3 bg-secondary/30 rounded-2xl px-4">
                  <div className="text-[10px] font-black uppercase tracking-widest text-primary mb-2 flex items-center gap-1">
                    <Info className="w-3 h-3" /> GST Breakdown
                  </div>
                  {taxBreakdown.igst > 0 ? (
                    <div className="flex justify-between text-xs font-bold">
                      <span>IGST (Inter-state)</span>
                      <span>₹{taxBreakdown.igst.toLocaleString('en-IN')}</span>
                    </div>
                  ) : (
                    <>
                      <div className="flex justify-between text-xs font-bold">
                        <span>CGST (Central)</span>
                        <span>₹{taxBreakdown.cgst.toLocaleString('en-IN')}</span>
                      </div>
                      <div className="flex justify-between text-xs font-bold mt-1">
                        <span>SGST (State)</span>
                        <span>₹{taxBreakdown.sgst.toLocaleString('en-IN')}</span>
                      </div>
                    </>
                  )}
                </div>

                <div className="flex justify-between items-end pt-4">
                  <div className="text-sm font-black uppercase tracking-widest">Total Amount</div>
                  <div className="text-3xl font-black">₹{grandTotal.toLocaleString('en-IN')}</div>
                </div>
              </div>

              <div className="mt-8 flex items-center gap-3 p-4 bg-primary/5 rounded-2xl border border-primary/10">
                <Clock className="w-5 h-5 text-primary" />
                <div className="text-[10px] font-bold text-primary uppercase tracking-tighter">
                  {items.every(i => i.type === "digital") 
                    ? "Instant access in your library within minutes" 
                    : `Estimated delivery by ${new Date(Date.now() + 4 * 86400000).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}`
                  }
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </main>
  );
}

