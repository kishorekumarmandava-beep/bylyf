"use client";

import React from "react";
import Link from "next/link";
import { Product } from "@/types/product";
import { cn } from "@/lib/utils";
import { ShoppingCart, Star, Zap } from "lucide-react";
import { motion } from "framer-motion";
import { useCartStore } from "@/store/useCartStore";
import toast from "react-hot-toast";
import { useActiveCampaign } from "@/hooks/useActiveCampaign";
import { useRouter } from "next/navigation";

interface ProductCardProps {
  product: Product;
}

export default function ProductCard({ product }: ProductCardProps) {
  const addItem = useCartStore((state) => state.addItem);
  const router = useRouter();
  const discount = Math.round(((product.mrp - product.sellingPrice) / product.mrp) * 100);
  const { hasActiveCampaign } = useActiveCampaign();

  const hasVariants = product.variants && product.variants.length > 0;

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    if (product.stock <= 0) {
      toast.error("This product is out of stock!");
      return;
    }
    if (hasVariants) {
      router.push(`/product/${product.slug}`);
      toast.error("Please select a size and color first!");
    } else {
      addItem(product);
      toast.success(`${product.title} added to cart!`);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -8 }}
      className="group bg-background rounded-[2.5rem] border border-border overflow-hidden shadow-sm hover:shadow-2xl transition-all duration-500"
    >
      <Link href={`/product/${product.slug}`} className="block relative aspect-square overflow-hidden bg-secondary/50">
        <img 
          src={product.images[0]} 
          alt={product.title}
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
        />
        
        {/* Badges */}
        <div className="absolute top-4 left-4 flex flex-col gap-2">
          {discount > 0 && (
            <div className="px-3 py-1 bg-destructive text-destructive-foreground text-xs font-black rounded-full">
              -{discount}% OFF
            </div>
          )}
          {product.luckyDrawEligible && hasActiveCampaign && (
            <div className="px-3 py-1 bg-primary text-primary-foreground text-xs font-black rounded-full flex items-center gap-1">
              <Zap className="w-3 h-3 fill-current" />
              DRAW ELIGIBLE
            </div>
          )}
        </div>
      </Link>

      <div className="p-6">
        <div className="flex justify-between items-start mb-2">
          <span className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground">
            {product.brand} • {product.category}
          </span>
          <div className="flex items-center gap-1 text-yellow-500">
            <Star className="w-3 h-3 fill-current" />
            <span className="text-xs font-bold">4.8</span>
          </div>
        </div>

        <Link href={`/product/${product.slug}`}>
          <h3 className="text-xl font-bold tracking-tight mb-2 group-hover:text-primary transition-colors line-clamp-1">
            {product.title}
          </h3>
        </Link>
        
        <p className="text-sm text-muted-foreground line-clamp-2 mb-4 h-10">
          {product.description}
        </p>

        <div className="flex items-end justify-between mt-auto">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-2xl font-black">₹{product.sellingPrice.toLocaleString('en-IN')}</span>
              {discount > 0 && (
                <span className="text-sm text-muted-foreground line-through decoration-destructive/50">
                  ₹{product.mrp.toLocaleString('en-IN')}
                </span>
              )}
            </div>
            <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-tighter">
              Incl. GST • {product.taxMode}
            </p>
          </div>

          <button 
            onClick={handleAddToCart}
            disabled={product.stock <= 0}
            className="p-4 bg-primary text-primary-foreground rounded-2xl hover:scale-110 transition-transform active:scale-95 shadow-lg shadow-primary/20 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 disabled:active:scale-100"
          >
            <ShoppingCart className="w-5 h-5" />
          </button>
        </div>
      </div>
    </motion.div>
  );
}
