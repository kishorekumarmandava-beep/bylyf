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
  CreditCard,
  X
} from "lucide-react";
import { db } from "@/lib/firebase";
import { collection, query, orderBy, getDocs, where, doc, updateDoc } from "firebase/firestore";
import { cn } from "@/lib/utils";
import toast from "react-hot-toast";

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedOrder, setSelectedOrder] = useState<any | null>(null);
  const [agents, setAgents] = useState<any[]>([]);

  // New tracking edit state
  const [updating, setUpdating] = useState(false);
  const [editStatus, setEditStatus] = useState("");
  const [editCourier, setEditCourier] = useState("");
  const [editTracking, setEditTracking] = useState("");

  useEffect(() => {
    if (selectedOrder) {
      setEditStatus(selectedOrder.status || "paid");
      setEditCourier(selectedOrder.courierPartner || "In-House Delivery");
      setEditTracking(selectedOrder.trackingNumber || "");
    }
  }, [selectedOrder]);

  const handleUpdateTracking = async () => {
    if (!selectedOrder) return;
    setUpdating(true);
    try {
      const orderRef = doc(db, "orders", selectedOrder.id);
      await updateDoc(orderRef, {
        status: editStatus,
        courierPartner: editCourier,
        trackingNumber: editTracking
      });
      
      toast.success("Order updated successfully!");
      setOrders(prev => prev.map(o => o.id === selectedOrder.id ? {
        ...o,
        status: editStatus,
        courierPartner: editCourier,
        trackingNumber: editTracking
      } : o));
      setSelectedOrder({
        ...selectedOrder,
        status: editStatus,
        courierPartner: editCourier,
        trackingNumber: editTracking
      });
    } catch (err: any) {
      console.error(err);
      toast.error("Failed to update order.");
    } finally {
      setUpdating(false);
    }
  };

  useEffect(() => {
    fetchOrders();
    fetchAgents();
  }, []);

  const fetchAgents = async () => {
    try {
      const q = query(collection(db, "users"), where("role", "in", ["agent", "storefront_agent"]));
      const snapshot = await getDocs(q);
      const agentsList = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          displayName: data.displayName || "Agent",
          referralCode: data.referralCode || doc.id.slice(0, 8).toUpperCase()
        };
      });
      setAgents(agentsList);
    } catch (err) {
      console.error("Error fetching agents:", err);
    }
  };

  const getAgentAttributionText = (referralCode: string) => {
    if (!referralCode) return "Direct";
    
    const matchingAgent = agents.find(
      a => a.referralCode?.toUpperCase() === referralCode.toUpperCase() ||
           a.id.slice(0, 8).toUpperCase() === referralCode.toUpperCase()
    );
    
    if (matchingAgent) {
      return `${matchingAgent.displayName} (${referralCode.toUpperCase()})`;
    }
    
    return referralCode.toUpperCase();
  };

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
                        {order.status || "paid"}
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <div className="text-[10px] font-black uppercase tracking-widest">
                        {order.referralCode ? (
                          <span className="text-primary flex items-center gap-1"><User className="w-3 h-3" /> {getAgentAttributionText(order.referralCode)}</span>
                        ) : "Direct"}
                      </div>
                    </td>
                    <td className="px-8 py-6 text-right">
                      <button 
                        onClick={() => setSelectedOrder(order)}
                        className="p-2 hover:bg-secondary rounded-lg transition-colors"
                      >
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

      {/* Order Details Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-background border border-border rounded-[3rem] shadow-3xl w-full max-w-3xl overflow-hidden max-h-[90vh] flex flex-col">
            {/* Modal Header */}
            <div className="p-8 border-b border-border flex justify-between items-center shrink-0">
              <div>
                <h3 className="text-2xl font-black tracking-tight font-sans">Order Details</h3>
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mt-1 font-mono">
                  ID: {selectedOrder.id}
                </p>
              </div>
              <button 
                onClick={() => setSelectedOrder(null)}
                className="p-3 bg-secondary rounded-2xl hover:bg-border transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            
            {/* Modal Content (Scrollable) */}
            <div className="p-8 overflow-y-auto space-y-8 flex-1">
              {/* Order Status & Tracking Admin Tools */}
              <div className="bg-secondary/30 p-6 rounded-3xl border border-border space-y-6">
                <div className="flex justify-between items-center mb-2">
                  <h4 className="text-lg font-black">Tracking & Status</h4>
                  <div className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                    Attribution: {getAgentAttributionText(selectedOrder.referralCode)}
                  </div>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1 block">Status</label>
                    <select 
                      value={editStatus}
                      onChange={(e) => setEditStatus(e.target.value)}
                      className="w-full px-4 py-2 bg-background border border-border rounded-xl text-sm font-bold outline-none focus:ring-2 focus:ring-primary"
                    >
                      <option value="paid">Paid (Unfulfilled)</option>
                      <option value="processing">Processing</option>
                      <option value="shipped">Shipped</option>
                      <option value="delivered">Delivered</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1 block">Courier Partner</label>
                    <select 
                      value={editCourier}
                      onChange={(e) => setEditCourier(e.target.value)}
                      className="w-full px-4 py-2 bg-background border border-border rounded-xl text-sm font-bold outline-none focus:ring-2 focus:ring-primary"
                    >
                      <option value="In-House Delivery">In-House Delivery</option>
                      <option value="Shiprocket">Shiprocket</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1 block">Tracking Number</label>
                    <input 
                      type="text"
                      value={editTracking}
                      onChange={(e) => setEditTracking(e.target.value)}
                      placeholder="e.g. AWB12345678"
                      className="w-full px-4 py-2 bg-background border border-border rounded-xl text-sm font-bold outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>
                </div>

                <div className="flex justify-between items-center pt-4 border-t border-border/40">
                  <div className="space-y-1">
                    <div className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Razorpay Details</div>
                    <div className="font-mono text-[10px] text-muted-foreground break-all">
                      Pay: {selectedOrder.paymentId || "N/A"} | Ord: {selectedOrder.orderId || "N/A"}
                    </div>
                  </div>
                  <button 
                    onClick={handleUpdateTracking}
                    disabled={updating}
                    className="px-6 py-2 bg-primary text-primary-foreground rounded-xl text-xs font-black uppercase tracking-widest shadow-lg hover:shadow-primary/20 transition-all active:scale-95 disabled:opacity-50"
                  >
                    {updating ? "Saving..." : "Update Tracking"}
                  </button>
                </div>
              </div>

              {/* Customer Info */}
              <div>
                <h4 className="text-lg font-black mb-4">Customer Info</h4>
                <div className="p-6 bg-secondary/20 rounded-3xl border border-border text-sm space-y-2">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Full Name</span>
                    <span className="font-bold">{selectedOrder.shippingAddress?.fullName || "N/A"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Phone Number</span>
                    <span className="font-bold">{selectedOrder.shippingAddress?.phone || "N/A"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Address</span>
                    <span className="font-bold text-right max-w-xs">{selectedOrder.shippingAddress?.addressLine || "N/A"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">City & State</span>
                    <span className="font-bold">
                      {selectedOrder.shippingAddress?.city || "N/A"}, {selectedOrder.shippingAddress?.state || "N/A"} - {selectedOrder.shippingAddress?.pincode || ""}
                    </span>
                  </div>
                </div>
              </div>

              {/* Items Summary */}
              <div>
                <h4 className="text-lg font-black mb-4">Items Summary</h4>
                <div className="space-y-4 bg-background rounded-3xl border border-border p-6">
                  {selectedOrder.items?.map((item: any, idx: number) => (
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
                </div>
              </div>

              {/* Financial Summary */}
              <div>
                <h4 className="text-lg font-black mb-4">Financial Summary</h4>
                <div className="p-6 bg-secondary/20 rounded-3xl border border-border text-sm space-y-3">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span>₹{selectedOrder.subtotal?.toLocaleString('en-IN')}</span>
                  </div>
                  {selectedOrder.discount > 0 && (
                    <div className="flex justify-between text-success font-bold">
                      <span>Discount</span>
                      <span>-₹{selectedOrder.discount?.toLocaleString('en-IN')}</span>
                    </div>
                  )}
                  <div className="flex justify-between font-black text-base pt-3 border-t border-border/50">
                    <span>Total Amount</span>
                    <span>₹{selectedOrder.total?.toLocaleString('en-IN')}</span>
                  </div>
                  {selectedOrder.agentCommission > 0 && (
                    <div className="flex justify-between text-primary font-bold pt-3 border-t border-border/50">
                      <span>Agent Commission</span>
                      <span>₹{selectedOrder.agentCommission?.toLocaleString('en-IN')}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            {/* Modal Footer */}
            <div className="p-8 border-t border-border flex justify-end shrink-0">
              <button 
                onClick={() => setSelectedOrder(null)}
                className="px-8 py-3 bg-primary text-primary-foreground rounded-2xl font-black text-sm uppercase tracking-widest shadow-lg hover:shadow-primary/20 transition-all active:scale-95"
              >
                Close Details
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
