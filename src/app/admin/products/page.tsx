"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { 
  Plus, 
  Search, 
  Filter, 
  MoreVertical, 
  Edit3, 
  Trash2, 
  Zap,
  ExternalLink,
  Package,
  ArrowUpRight,
  Download
} from "lucide-react";
import { db } from "@/lib/firebase";
import { collection, getDocs, doc, updateDoc, deleteDoc, query, orderBy } from "firebase/firestore";
import { Product } from "@/types/product";
import toast from "react-hot-toast";
import { cn } from "@/lib/utils";
import Link from "next/link";

export default function AdminProductsPage() {
  const { profile } = useAuth();
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchProducts = async () => {
    try {
      const q = query(collection(db, "products"), orderBy("createdAt", "desc"));
      const snapshot = await getDocs(q);
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Product[];
      setProducts(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const toggleLuckyDraw = async (productId: string, currentStatus: boolean) => {
    try {
      const productRef = doc(db, "products", productId);
      await updateDoc(productRef, { luckyDrawEligible: !currentStatus });
      toast.success("Updated Lucky Draw status");
      fetchProducts(); // Refresh list
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handleDelete = async (productId: string) => {
    if (window.confirm("Are you sure you want to delete this product?")) {
      try {
        await deleteDoc(doc(db, "products", productId));
        toast.success("Product deleted");
        fetchProducts();
      } catch (error: any) {
        toast.error(error.message);
      }
    }
  };

  const exportToCSV = () => {
    const headers = ["ID", "Title", "SKU", "HSN", "MRP", "Selling Price", "GST Rate", "Stock", "Category", "Lucky Draw"];
    const rows = products.map(p => [
      p.id, p.title, p.sku, p.hsnSac, p.mrp, p.sellingPrice, p.gstRate, p.stock, p.category, p.luckyDrawEligible ? "Yes" : "No"
    ]);

    const csvContent = [headers, ...rows].map(e => e.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `bylyf_products_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-12 gap-6">
          <div>
            <h1 className="text-4xl font-black tracking-tight">Product Management</h1>
            <p className="text-muted-foreground mt-2">Manage your inventory, pricing, and lucky draw eligibility.</p>
          </div>
          
          <div className="flex gap-4">
            <button 
              onClick={exportToCSV}
              className="px-6 py-4 bg-secondary text-foreground rounded-2xl font-bold flex items-center gap-2 hover:bg-secondary/80 transition-all"
            >
              <Download className="w-5 h-5" />
              Download CSV
            </button>
            <Link 
              href="/admin/products/new"
              className="px-8 py-4 bg-primary text-primary-foreground rounded-2xl font-black flex items-center gap-2 hover:scale-105 transition-all shadow-xl shadow-primary/20"
            >
              <Plus className="w-5 h-5" />
              Add New Product
            </Link>
          </div>
        </div>

        {/* Filters & Search */}
        <div className="flex flex-col md:flex-row gap-4 mb-8">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-3.5 w-5 h-5 text-muted-foreground" />
            <input 
              type="text" 
              placeholder="Search by title, SKU, or HSN..."
              className="w-full pl-12 pr-4 py-3.5 bg-secondary/50 border border-border rounded-2xl outline-none focus:ring-2 focus:ring-primary transition-all"
            />
          </div>
          <button className="px-6 py-3.5 bg-secondary/50 border border-border rounded-2xl font-bold flex items-center gap-2">
            <Filter className="w-5 h-5" />
            Filters
          </button>
        </div>

        {/* Product Table */}
        <div className="bg-secondary/30 rounded-[3rem] border border-border overflow-hidden">
          {loading ? (
            <div className="p-20 text-center font-black">LOADING PRODUCTS...</div>
          ) : products.length === 0 ? (
            <div className="p-20 text-center">
              <Package className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground font-bold italic">No products found in the database.</p>
              <Link href="/admin/products/new" className="text-primary font-black mt-4 inline-block hover:underline">Create your first product</Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-background/50 border-b border-border">
                  <tr>
                    <th className="px-8 py-5 text-xs font-black uppercase tracking-widest">Product</th>
                    <th className="px-8 py-5 text-xs font-black uppercase tracking-widest">SKU / HSN</th>
                    <th className="px-8 py-5 text-xs font-black uppercase tracking-widest">Pricing</th>
                    <th className="px-8 py-5 text-xs font-black uppercase tracking-widest">Stock</th>
                    <th className="px-8 py-5 text-xs font-black uppercase tracking-widest text-center">Lucky Draw</th>
                    <th className="px-8 py-5 text-xs font-black uppercase tracking-widest"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {products.map((product) => (
                    <tr key={product.id} className="hover:bg-background/40 transition-colors">
                      <td className="px-8 py-6">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 bg-background rounded-xl overflow-hidden border border-border">
                            <img src={product.images[0]} alt="" className="w-full h-full object-cover" />
                          </div>
                          <div>
                            <div className="font-black text-sm">{product.title}</div>
                            <div className="text-[10px] text-muted-foreground uppercase font-bold">{product.category} • {product.brand}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-8 py-6">
                        <div className="text-xs font-bold">{product.sku}</div>
                        <div className="text-[10px] text-muted-foreground uppercase font-bold mt-1">HSN: {product.hsnSac}</div>
                      </td>
                      <td className="px-8 py-6">
                        <div className="font-black text-sm">₹{product.sellingPrice.toLocaleString('en-IN')}</div>
                        <div className="text-[10px] text-muted-foreground line-through">₹{product.mrp.toLocaleString('en-IN')}</div>
                      </td>
                      <td className="px-8 py-6">
                        <div className={cn(
                          "inline-flex px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest",
                          product.stock > 10 ? "bg-success/10 text-success" : "bg-destructive/10 text-destructive"
                        )}>
                          {product.stock} Units
                        </div>
                      </td>
                      <td className="px-8 py-6">
                        <div className="flex justify-center">
                          <button 
                            onClick={() => toggleLuckyDraw(product.id, product.luckyDrawEligible)}
                            className={cn(
                              "p-3 rounded-xl transition-all",
                              product.luckyDrawEligible ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20" : "bg-secondary text-muted-foreground"
                            )}
                          >
                            <Zap className={cn("w-5 h-5", product.luckyDrawEligible ? "fill-current" : "")} />
                          </button>
                        </div>
                      </td>
                      <td className="px-8 py-6 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Link href={`/product/${product.slug}`} className="p-2 hover:bg-secondary rounded-lg transition-colors">
                            <ExternalLink className="w-4 h-4" />
                          </Link>
                          <button className="p-2 hover:bg-secondary rounded-lg transition-colors">
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => handleDelete(product.id)}
                            className="p-2 hover:bg-destructive/10 text-destructive rounded-lg transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
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
