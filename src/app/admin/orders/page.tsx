"use client";

import React, { useState, useEffect } from "react";
import { 
  ShoppingBag, 
  Search, 
  Filter, 
  Download, 
  ExternalLink,
  CheckCircle2,
  Clock,
  User,
  MapPin,
  CreditCard
} from "lucide-react";
import { db } from "@/lib/firebase";
import { collection, query, orderBy, getDocs } from "firebase/firestore";
import { cn } from "@/lib/utils";
import toast from "react-hot-toast";

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDate, setSelectedDate] = useState("");

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const q = query(collection(db, "orders"), orderBy("createdAt", "desc"));
      const snapshot = await getDocs(q);
      setOrders(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    } catch (err: any) {
      console.error(err);
      toast.error("Failed to fetch orders. Access denied.");
    } finally {
      setLoading(false);
    }
  };

  const getOrderDateString = (order: any) => {
    if (!order.createdAt) return "";
    const dateObj = order.createdAt.toDate();
    const year = dateObj.getFullYear();
    const month = String(dateObj.getMonth() + 1).padStart(2, '0');
    const day = String(dateObj.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const todayStr = (() => {
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  })();

  const todayOrders = orders.filter(o => getOrderDateString(o) === todayStr);
  const todayRevenue = todayOrders.reduce((acc, o) => acc + (o.total || 0), 0);

  const filteredOrders = orders.filter(order => {
    const matchesDate = selectedDate ? getOrderDateString(order) === selectedDate : true;
    
    const idMatches = order.id?.toLowerCase().includes(searchQuery.toLowerCase());
    const nameMatches = order.shippingAddress?.fullName?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesSearch = searchQuery ? (idMatches || nameMatches) : true;
    
    return matchesDate && matchesSearch;
  });

  const exportToCSV = () => {
    const headers = ["Order ID", "Date", "Customer", "Phone", "State", "Subtotal", "Discount", "Tax (CGST)", "Tax (SGST)", "Tax (IGST)", "Total", "Coupons Earned", "Coupon IDs", "Referral Code", "Agent Comm."];
    
    const rows = filteredOrders.map(o => {
      const tax = o.total - (o.total / 1.18);
      const isInterState = o.shippingAddress?.state !== "Telangana";
      
      return [
        o.id,
        o.createdAt?.toDate().toISOString(),
        o.shippingAddress?.fullName,
        o.shippingAddress?.phone,
        o.shippingAddress?.state,
        o.subtotal,
        o.discount,
        !isInterState ? (tax / 2).toFixed(2) : 0,
        !isInterState ? (tax / 2).toFixed(2) : 0,
        isInterState ? tax.toFixed(2) : 0,
        o.total,
        o.couponsEarned || 0,
        o.couponIds ? o.couponIds.join("; ") : "None",
        o.referralCode || "Direct",
        o.agentCommission || 0
      ];
    });

    const csvContent = [headers, ...rows].map(e => e.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `bylyf_sales_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-12">
      <div className="flex flex-col md:flex-row justify-between items-end mb-12 gap-6">
        <div>
          <h1 className="text-4xl font-black tracking-tight">Order Monitor</h1>
          <p className="text-muted-foreground mt-2">Track real-time sales and export data for Zoho/Accounting.</p>
        </div>
        
        <button 
          onClick={exportToCSV}
          className="px-8 py-4 bg-primary text-primary-foreground rounded-2xl font-black flex items-center gap-2 hover:scale-105 transition-all shadow-xl shadow-primary/20"
        >
          <Download className="w-5 h-5" />
          Export Sales CSV
        </button>
      </div>

      {/* Metrics Section */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
        <div className="p-8 bg-secondary/30 rounded-3xl border border-border">
          <div className="text-xs font-black uppercase tracking-widest text-muted-foreground mb-2">Today's Orders</div>
          <div className="text-3xl font-black">{todayOrders.length}</div>
        </div>
        <div className="p-8 bg-secondary/30 rounded-3xl border border-border">
          <div className="text-xs font-black uppercase tracking-widest text-muted-foreground mb-2">Today's Revenue</div>
          <div className="text-3xl font-black text-primary">₹{todayRevenue.toLocaleString('en-IN')}</div>
        </div>
        <div className="p-8 bg-secondary/30 rounded-3xl border border-border">
          <div className="text-xs font-black uppercase tracking-widest text-muted-foreground mb-2">
            {selectedDate ? `Orders (${selectedDate})` : "Filtered Orders"}
          </div>
          <div className="text-3xl font-black">{filteredOrders.length}</div>
        </div>
        <div className="p-8 bg-secondary/30 rounded-3xl border border-border">
          <div className="text-xs font-black uppercase tracking-widest text-muted-foreground mb-2">
            {selectedDate ? `Revenue (${selectedDate})` : "Filtered Revenue"}
          </div>
          <div className="text-3xl font-black text-primary">₹{filteredOrders.reduce((acc, o) => acc + (o.total || 0), 0).toLocaleString('en-IN')}</div>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="flex flex-col md:flex-row gap-4 mb-8">
        <div className="flex-1 relative">
          <Search className="absolute left-4 top-3.5 w-5 h-5 text-muted-foreground" />
          <input 
            type="text" 
            placeholder="Search by Order ID, Customer Name..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-3.5 bg-secondary/30 border border-border rounded-2xl outline-none focus:ring-2 focus:ring-primary transition-all font-semibold"
          />
        </div>
        <div className="flex gap-4">
          <input 
            type="date" 
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="px-6 py-3.5 bg-secondary/30 border border-border rounded-2xl outline-none focus:ring-2 focus:ring-primary font-semibold text-foreground cursor-pointer"
          />
          {selectedDate && (
            <button 
              onClick={() => setSelectedDate("")}
              className="px-6 py-3.5 bg-secondary text-foreground rounded-2xl font-bold hover:bg-secondary/80 transition-all"
            >
              Clear Date
            </button>
          )}
        </div>
      </div>

      <div className="bg-secondary/30 rounded-[3rem] border border-border overflow-hidden">
        {loading ? (
          <div className="p-20 text-center font-black">LOADING ORDERS...</div>
        ) : filteredOrders.length === 0 ? (
          <div className="p-20 text-center text-muted-foreground italic">No orders found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-background/50 border-b border-border">
                <tr>
                  <th className="px-8 py-5 text-xs font-black uppercase tracking-widest">Order</th>
                  <th className="px-8 py-5 text-xs font-black uppercase tracking-widest">Customer</th>
                  <th className="px-8 py-5 text-xs font-black uppercase tracking-widest">Total</th>
                  <th className="px-8 py-5 text-xs font-black uppercase tracking-widest">Coupons</th>
                  <th className="px-8 py-5 text-xs font-black uppercase tracking-widest">Status</th>
                  <th className="px-8 py-5 text-xs font-black uppercase tracking-widest">Attribution</th>
                  <th className="px-8 py-5 text-xs font-black uppercase tracking-widest"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-background/40 transition-colors">
                    <td className="px-8 py-6">
                      <div className="font-black text-sm uppercase font-mono">{order.id.slice(0, 8)}</div>
                      <div className="text-[10px] text-muted-foreground font-bold">{order.createdAt?.toDate().toLocaleDateString()}</div>
                    </td>
                    <td className="px-8 py-6">
                      <div className="font-bold text-sm">{order.shippingAddress?.fullName}</div>
                      <div className="text-[10px] text-muted-foreground font-bold uppercase">{order.shippingAddress?.state}</div>
                    </td>
                    <td className="px-8 py-6">
                      <div className="font-black text-sm">₹{order.total.toLocaleString('en-IN')}</div>
                      <div className="text-[10px] text-success font-black uppercase">Paid</div>
                    </td>
                    <td className="px-8 py-6">
                      <div className="font-black text-sm">{order.couponsEarned || 0}</div>
                      <div className="text-[10px] text-muted-foreground font-mono break-all max-w-[150px]">
                        {order.couponIds?.join(", ")}
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <div className="inline-flex px-3 py-1 bg-success/10 text-success rounded-full text-[10px] font-black uppercase tracking-widest">
                        Completed
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <div className="text-[10px] font-black uppercase tracking-widest">
                        {order.referralCode ? (
                          <span className="text-primary flex items-center gap-1"><User className="w-3 h-3" /> {order.referralCode}</span>
                        ) : "Direct"}
                      </div>
                    </td>
                    <td className="px-8 py-6 text-right">
                      <button className="p-2 hover:bg-secondary rounded-lg transition-colors">
                        <ExternalLink className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
