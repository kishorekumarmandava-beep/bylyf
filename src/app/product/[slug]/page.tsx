"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { db } from "@/lib/firebase";
import { collection, query, where, getDocs } from "firebase/firestore";
import Navbar from "@/components/layout/Navbar";
import { useCartStore } from "@/store/useCartStore";
import { Product } from "@/types/product";
import toast from "react-hot-toast";
import { useActiveCampaign } from "@/hooks/useActiveCampaign";
import { 
  Zap, 
  ShoppingCart, 
  ShieldCheck, 
  Truck, 
  RotateCcw, 
  CheckCircle2, 
  ChevronRight,
  Star,
  Info,
  Maximize2,
  X
} from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

export default function ProductPage() {
  const { slug } = useParams();
  const router = useRouter();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const addItem = useCartStore((state) => state.addItem);
  const { hasActiveCampaign } = useActiveCampaign();

  const [selectedImage, setSelectedImage] = useState(0);
  const [selectedSize, setSelectedSize] = useState<string>("");
  const [selectedColor, setSelectedColor] = useState<string>("");

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const q = query(collection(db, "products"), where("slug", "==", slug));
        const querySnapshot = await getDocs(q);
        
        if (!querySnapshot.empty) {
          const doc = querySnapshot.docs[0];
          setProduct({ id: doc.id, ...doc.data() } as Product);
        }
      } catch (error) {
        console.error("Error fetching product:", error);
      } finally {
        setLoading(false);
      }
    };

    if (slug) fetchProduct();
  }, [slug]);

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center font-black italic text-muted-foreground">Loading Product Details...</div>;
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4 text-center">
        <h1 className="text-4xl font-black mb-4">Product Not Found</h1>
        <p className="text-muted-foreground mb-8 text-lg">The product you are looking for doesn't exist or has been moved.</p>
        <button 
          onClick={() => router.push("/")}
          className="px-8 py-4 bg-primary text-primary-foreground rounded-2xl font-bold"
        >
          Back to Home
        </button>
      </div>
    );
  }

  const discount = Math.round(((product.mrp - product.sellingPrice) / product.mrp) * 100);

  const hasVariants = product.variants && product.variants.length > 0;
  const uniqueSizes = hasVariants 
    ? Array.from(new Set(product.variants?.map(v => v.size))) 
    : [];
  const uniqueColors = hasVariants 
    ? Array.from(new Set(product.variants?.map(v => v.color))) 
    : [];

  const selectedVariant = hasVariants
    ? product.variants?.find(v => v.size === selectedSize && v.color === selectedColor)
    : null;

  const currentStock = hasVariants
    ? (selectedVariant ? selectedVariant.stock : 0)
    : product.stock;

  const handleAddToCart = () => {
    if (hasVariants && (!selectedSize || !selectedColor)) {
      toast.error("Please select both size and color.");
      return;
    }
    if (hasVariants && currentStock <= 0) {
      toast.error("This combination is out of stock.");
      return;
    }
    addItem(product, selectedSize, selectedColor);
    toast.success("Added to cart!");
  };

  const handleBuyNow = () => {
    if (hasVariants && (!selectedSize || !selectedColor)) {
      toast.error("Please select both size and color.");
      return;
    }
    if (hasVariants && currentStock <= 0) {
      toast.error("This combination is out of stock.");
      return;
    }
    addItem(product, selectedSize, selectedColor);
    router.push("/cart");
  };

  return (
    <main className="min-h-screen bg-background">
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Breadcrumbs */}
        <nav className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-muted-foreground mb-12">
          <Link href="/">Home</Link>
          <ChevronRight className="w-3 h-3" />
          <Link href="/shop">{product.category}</Link>
          <ChevronRight className="w-3 h-3" />
          <span className="text-foreground">{product.title}</span>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-16">
          {/* Left: Image Gallery */}
          <div className="lg:col-span-7 space-y-6">
            <div className="relative aspect-square rounded-[3rem] overflow-hidden bg-secondary/50 border border-border group">
              <img 
                src={product.images[selectedImage]} 
                alt={product.title}
                className="w-full h-full object-cover"
              />
              <button className="absolute bottom-6 right-6 p-4 bg-background/80 backdrop-blur-md rounded-2xl border border-border opacity-0 group-hover:opacity-100 transition-opacity">
                <Maximize2 className="w-5 h-5" />
              </button>
            </div>
            
            <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
              {product.images.map((img: string, idx: number) => (
                <button 
                  key={idx}
                  onClick={() => setSelectedImage(idx)}
                  className={cn(
                    "relative w-24 aspect-square rounded-2xl overflow-hidden border-2 transition-all shrink-0",
                    selectedImage === idx ? "border-primary scale-105" : "border-border hover:border-primary/50"
                  )}
                >
                  <img src={img} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          </div>

          {/* Right: Product Info */}
          <div className="lg:col-span-5">
            <div className="sticky top-32">
              <div className="flex items-center gap-3 mb-6">
                <span className="px-4 py-1.5 bg-secondary text-foreground text-[10px] font-black uppercase tracking-[0.2em] rounded-full">
                  {product.brand}
                </span>
                {product.luckyDrawEligible && hasActiveCampaign && (
                  <span className="px-4 py-1.5 bg-primary text-primary-foreground text-[10px] font-black uppercase tracking-[0.2em] rounded-full flex items-center gap-1">
                    <Zap className="w-3 h-3 fill-current" />
                    LUCKY DRAW ELIGIBLE
                  </span>
                )}
              </div>

              <h1 className="text-4xl lg:text-5xl font-black tracking-tighter mb-4 leading-tight">
                {product.title}
              </h1>

              <div className="flex items-center gap-6 mb-8">
                <div className="flex items-center gap-1 text-yellow-500">
                  {[1,2,3,4,5].map(i => <Star key={i} className="w-5 h-5 fill-current" />)}
                  <span className="ml-2 text-sm font-black text-foreground">4.9 (124 Reviews)</span>
                </div>
                <div className="w-px h-4 bg-border"></div>
                <div className="text-sm font-bold flex items-center gap-1">
                  {hasVariants ? (
                    selectedSize && selectedColor ? (
                      currentStock > 0 ? (
                        <span className="text-success flex items-center gap-1"><CheckCircle2 className="w-4 h-4" /> In Stock ({currentStock})</span>
                      ) : (
                        <span className="text-destructive flex items-center gap-1"><X className="w-4 h-4" /> Out of Stock</span>
                      )
                    ) : (
                      <span className="text-muted-foreground">Select size & color</span>
                    )
                  ) : product.stock > 0 ? (
                    <span className="text-success flex items-center gap-1"><CheckCircle2 className="w-4 h-4" /> In Stock</span>
                  ) : (
                    <span className="text-destructive flex items-center gap-1"><X className="w-4 h-4" /> Out of Stock</span>
                  )}
                </div>
              </div>

              <div className="p-8 bg-secondary/50 rounded-[2.5rem] border border-border mb-8">
                {/* Size & Color Selectors */}
                {hasVariants && (
                  <div className="space-y-6 mb-8 border-b border-border pb-6">
                    {/* Sizes */}
                    <div className="space-y-3">
                      <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Select Size</label>
                      <div className="flex flex-wrap gap-2">
                        {uniqueSizes.map((size) => {
                          const sizeStock = product.variants
                            ?.filter(v => v.size === size)
                            .reduce((acc, v) => acc + v.stock, 0) || 0;
                          const isSizeDisabled = sizeStock <= 0;
                          
                          return (
                            <button
                              key={size}
                              type="button"
                              disabled={isSizeDisabled}
                              onClick={() => {
                                setSelectedSize(size);
                                const compatible = product.variants?.some(v => v.size === size && v.color === selectedColor && v.stock > 0);
                                if (!compatible) setSelectedColor("");
                              }}
                              className={cn(
                                "px-5 py-3 rounded-xl font-bold text-sm border-2 transition-all",
                                isSizeDisabled 
                                  ? "border-border text-muted-foreground line-through cursor-not-allowed opacity-40"
                                  : selectedSize === size
                                    ? "border-primary bg-primary text-primary-foreground scale-105"
                                    : "border-border bg-background hover:border-primary/50 text-foreground"
                              )}
                            >
                              {size}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Colors */}
                    <div className="space-y-3">
                      <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Select Color</label>
                      <div className="flex flex-wrap gap-2">
                        {uniqueColors.map((color) => {
                          const colorStock = product.variants
                            ?.filter(v => v.color === color && (!selectedSize || v.size === selectedSize))
                            .reduce((acc, v) => acc + v.stock, 0) || 0;
                          const isColorDisabled = colorStock <= 0;

                          return (
                            <button
                              key={color}
                              type="button"
                              disabled={isColorDisabled}
                              onClick={() => setSelectedColor(color)}
                              className={cn(
                                "px-5 py-3 rounded-xl font-bold text-sm border-2 transition-all",
                                isColorDisabled
                                  ? "border-border text-muted-foreground line-through cursor-not-allowed opacity-40"
                                  : selectedColor === color
                                    ? "border-primary bg-primary text-primary-foreground scale-105"
                                    : "border-border bg-background hover:border-primary/50 text-foreground"
                              )}
                            >
                              {color}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex items-baseline gap-4 mb-2">
                  <span className="text-5xl font-black">₹{product.sellingPrice.toLocaleString('en-IN')}</span>
                  {discount > 0 && (
                    <span className="text-xl text-muted-foreground line-through decoration-destructive/50">
                      ₹{product.mrp.toLocaleString('en-IN')}
                    </span>
                  )}
                  {discount > 0 && (
                    <span className="px-3 py-1 bg-destructive text-destructive-foreground text-xs font-black rounded-full">
                      -{discount}%
                    </span>
                  )}
                </div>
                <p className="text-sm text-muted-foreground flex items-center gap-2 mb-6">
                  Inclusive of all taxes (GST {product.gstRate}%)
                  <Info className="w-4 h-4" />
                </p>

                <div className="grid grid-cols-2 gap-4">
                  <button 
                    onClick={handleAddToCart}
                    className="py-5 bg-background border-2 border-primary text-primary rounded-2xl font-black flex items-center justify-center gap-3 hover:bg-primary hover:text-primary-foreground transition-all group"
                  >
                    <ShoppingCart className="w-6 h-6 group-hover:scale-110 transition-transform" />
                    ADD TO CART
                  </button>
                  <button 
                    onClick={handleBuyNow}
                    className="py-5 bg-primary text-primary-foreground rounded-2xl font-black shadow-2xl shadow-primary/30 hover:scale-[1.02] transition-all"
                  >
                    BUY NOW
                  </button>
                </div>
              </div>

              {/* Trust Features */}
              <div className="grid grid-cols-3 gap-4">
                {[
                  { 
                    icon: product.type === "digital" ? Zap : Truck, 
                    label: product.type === "digital" ? "Instant Delivery" : "Fast Delivery", 
                    sub: product.type === "digital" ? "Available in Library" : "2-4 Business Days" 
                  },
                  { 
                    icon: product.type === "digital" ? ShieldCheck : RotateCcw, 
                    label: product.type === "digital" ? "Lifetime Access" : "Easy Returns", 
                    sub: product.type === "digital" ? "Download Anytime" : "7 Day Replacement" 
                  },
                  { 
                    icon: ShieldCheck, 
                    label: "Secure", 
                    sub: "100% Genuine" 
                  }
                ].map((item, i) => (
                  <div key={i} className="text-center p-4">
                    <div className="w-12 h-12 bg-secondary rounded-2xl flex items-center justify-center mx-auto mb-3">
                      <item.icon className="w-6 h-6 text-muted-foreground" />
                    </div>
                    <div className="text-[10px] font-black uppercase tracking-widest">{item.label}</div>
                    <div className="text-[10px] text-muted-foreground mt-1">{item.sub}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Technical Details */}
        <div className="mt-24 pt-24 border-t border-border">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-16">
            <div className="lg:col-span-4">
              <h2 className="text-3xl font-black tracking-tight mb-6">Product Details</h2>
              <p className="text-muted-foreground leading-relaxed">
                {product.description}
              </p>
            </div>
            <div className="lg:col-span-8">
              <div className="bg-secondary/30 rounded-[2.5rem] border border-border overflow-hidden">
                <table className="w-full text-left">
                  <tbody className="divide-y divide-border">
                    {[
                      { label: "SKU", value: product.sku },
                      { label: "HSN / SAC", value: product.hsnSac },
                      { label: "GST Rate", value: `${product.gstRate}%` },
                      { label: "Country of Origin", value: product.countryOfOrigin },
                      { label: "Manufacturer", value: product.manufacturer },
                      { label: "Weight", value: `${product.weight} kg` },
                      { label: "Dimensions", value: `${product.dimensions.length} x ${product.dimensions.width} x ${product.dimensions.height} cm` },
                      { label: "Type", value: product.type.toUpperCase() }
                    ].map((spec: { label: string; value: string | number | undefined }, i: number) => (
                      <tr key={i} className="hover:bg-secondary/50 transition-colors">
                        <td className="px-8 py-4 text-sm font-bold text-muted-foreground uppercase tracking-widest w-1/3">{spec.label}</td>
                        <td className="px-8 py-4 text-sm font-semibold">{spec.value}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

import Link from "next/link";
