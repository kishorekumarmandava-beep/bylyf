"use client";

import React, { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { db } from "@/lib/firebase";
import { doc, getDoc, getDocs, collection, query, where } from "firebase/firestore";
import { Printer, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

export default function InvoicePage() {
  const { orderId } = useParams();
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        if (!orderId) return;
        const searchId = orderId as string;
        let foundOrder: any = null;

        // 1. Match by full Firestore ID
        try {
          const docRef = doc(db, "orders", searchId);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            foundOrder = { id: docSnap.id, ...docSnap.data() };
          }
        } catch (e) {}

        // 2. Match by Razorpay orderId
        if (!foundOrder) {
          const qRazor = query(collection(db, "orders"), where("orderId", "==", searchId));
          const snap = await getDocs(qRazor);
          if (!snap.empty) {
            foundOrder = { id: snap.docs[0].id, ...snap.docs[0].data() };
          }
        }

        // 3. Match by 8-char Firestore ID prefix
        if (!foundOrder && searchId.length === 8) {
          const snap = await getDocs(collection(db, "orders"));
          const match = snap.docs.find(d => d.id.slice(0, 8).toUpperCase() === searchId.toUpperCase());
          if (match) {
            foundOrder = { id: match.id, ...match.data() };
          }
        }

        if (foundOrder) {
          setOrder(foundOrder);
        } else {
          setError("Invoice not found.");
        }
      } catch (err) {
        console.error(err);
        setError("Error loading invoice.");
      } finally {
        setLoading(false);
      }
    };

    fetchOrder();
  }, [orderId]);

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center font-black animate-pulse">LOADING INVOICE...</div>;
  }

  if (error || !order) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center text-center p-4">
        <h1 className="text-3xl font-black mb-4">Invoice Not Found</h1>
        <p className="text-muted-foreground mb-8">We couldn't find the invoice for this order ID.</p>
        <Link href="/" className="px-6 py-3 bg-primary text-primary-foreground rounded-2xl font-bold">
          Return Home
        </Link>
      </div>
    );
  }

  const orderDate = order.createdAt?.toDate ? order.createdAt.toDate().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }) : "N/A";

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="min-h-screen bg-secondary/20 font-sans print:bg-white text-foreground">
      {/* Non-Printable Header */}
      <div className="max-w-4xl mx-auto p-4 print:hidden flex justify-between items-center my-4">
        <button onClick={() => window.history.back()} className="flex items-center gap-2 font-bold text-muted-foreground hover:text-primary transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back
        </button>
        <button 
          onClick={handlePrint}
          className="flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-xl font-black shadow-lg hover:scale-105 active:scale-95 transition-all"
        >
          <Printer className="w-4 h-4" /> Print Invoice
        </button>
      </div>

      {/* Printable Invoice Container */}
      <div className="max-w-4xl mx-auto bg-white print:shadow-none shadow-2xl rounded-2xl overflow-hidden print:rounded-none text-black">
        <div className="p-12 print:p-8">
          
          {/* Header */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-gray-200 pb-8 mb-8 gap-6">
            <div>
              <h1 className="text-4xl font-black tracking-tight text-gray-900">INVOICE</h1>
              <p className="text-sm font-bold text-gray-500 uppercase tracking-widest mt-1">
                Order #{order.id.slice(0, 8)}
              </p>
            </div>
            <div className="text-left md:text-right">
              <div className="font-black text-xl text-gray-900 tracking-tighter">BYLYF Store</div>
              <div className="text-sm text-gray-600 mt-1 max-w-[250px] leading-relaxed">
                Martyzee Private Limited<br/>
                Plot no 3, 3A Yadava Nagar<br/>
                Near Richmond Villas, B. Road<br/>
                Kurnool 518001
              </div>
            </div>
          </div>

          {/* Details Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
            <div>
              <h3 className="text-xs font-black uppercase tracking-widest text-gray-400 mb-2">Billed To</h3>
              <div className="text-gray-800 text-sm leading-relaxed">
                <span className="font-bold text-base block mb-1 text-gray-900">{order.shippingAddress?.fullName}</span>
                {order.shippingAddress?.addressLine}<br />
                {order.shippingAddress?.city}, {order.shippingAddress?.state} - {order.shippingAddress?.pincode}<br />
                <span className="mt-2 block font-medium">Phone: {order.shippingAddress?.phone}</span>
              </div>
            </div>
            <div className="text-left md:text-right space-y-4">
              <div>
                <h3 className="text-xs font-black uppercase tracking-widest text-gray-400 mb-1">Date</h3>
                <p className="font-bold text-gray-900">{orderDate}</p>
              </div>
              <div>
                <h3 className="text-xs font-black uppercase tracking-widest text-gray-400 mb-1">Payment ID</h3>
                <p className="font-mono text-sm text-gray-700">{order.paymentId || "N/A"}</p>
              </div>
            </div>
          </div>

          {/* Items Table */}
          <div className="mb-12">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b-2 border-gray-900">
                  <th className="py-3 px-2 text-xs font-black uppercase tracking-widest text-gray-500">Item Description</th>
                  <th className="py-3 px-2 text-xs font-black uppercase tracking-widest text-gray-500 text-center">Qty</th>
                  <th className="py-3 px-2 text-xs font-black uppercase tracking-widest text-gray-500 text-right">Price</th>
                  <th className="py-3 px-2 text-xs font-black uppercase tracking-widest text-gray-500 text-right">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {order.items?.map((item: any, idx: number) => (
                  <tr key={idx}>
                    <td className="py-4 px-2">
                      <div className="font-bold text-gray-900">{item.title}</div>
                      {(item.selectedSize || item.selectedColor) && (
                        <div className="text-xs text-gray-500 mt-1 uppercase font-semibold">
                          {item.selectedSize && `Size: ${item.selectedSize}`}
                          {item.selectedSize && item.selectedColor && " | "}
                          {item.selectedColor && `Color: ${item.selectedColor}`}
                        </div>
                      )}
                    </td>
                    <td className="py-4 px-2 text-center text-gray-700 font-medium">{item.quantity}</td>
                    <td className="py-4 px-2 text-right text-gray-700 font-medium">₹{item.price?.toLocaleString('en-IN')}</td>
                    <td className="py-4 px-2 text-right text-gray-900 font-black">₹{(item.price * item.quantity).toLocaleString('en-IN')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Summary */}
          <div className="flex flex-col md:flex-row justify-between items-end md:items-start gap-8">
            <div className="text-xs text-gray-500 max-w-sm order-2 md:order-1 leading-relaxed">
              <strong className="block text-gray-900 mb-1">Note:</strong>
              This is a computer-generated invoice and does not require a physical signature. Returns are subject to our refund policy.
            </div>
            
            <div className="w-full md:w-80 order-1 md:order-2">
              <div className="space-y-3 text-sm border-b border-gray-200 pb-4 mb-4">
                <div className="flex justify-between text-gray-600 font-medium">
                  <span>Subtotal</span>
                  <span>₹{order.subtotal?.toLocaleString('en-IN')}</span>
                </div>
                {order.discount > 0 && (
                  <div className="flex justify-between text-gray-600 font-medium">
                    <span>Discount</span>
                    <span>-₹{order.discount?.toLocaleString('en-IN')}</span>
                  </div>
                )}
                {order.loyaltyDiscount > 0 && (
                  <div className="flex justify-between text-gray-600 font-medium">
                    <span>Loyalty Discount</span>
                    <span>-₹{order.loyaltyDiscount?.toLocaleString('en-IN')}</span>
                  </div>
                )}
                <div className="flex justify-between text-gray-600 font-medium">
                  <span>Shipping</span>
                  <span>₹{(order.total - order.subtotal + (order.discount || 0) + (order.loyaltyDiscount || 0)) > 0 ? (order.total - order.subtotal + (order.discount || 0) + (order.loyaltyDiscount || 0)).toLocaleString('en-IN') : 0}</span>
                </div>
              </div>
              <div className="flex justify-between items-end">
                <span className="text-base font-black uppercase tracking-widest text-gray-900">Grand Total</span>
                <span className="text-3xl font-black text-gray-900">₹{order.total?.toLocaleString('en-IN')}</span>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
