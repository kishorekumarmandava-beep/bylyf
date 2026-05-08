"use client";

import React from "react";
import { Product } from "@/types/product";
import ProductCard from "./ProductCard";

interface ProductGridProps {
  products: Product[];
  title?: string;
  subtitle?: string;
}

export default function ProductGrid({ products, title, subtitle }: ProductGridProps) {
  return (
    <section className="py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {(title || subtitle) && (
          <div className="mb-12">
            {title && <h2 className="text-4xl font-black tracking-tight mb-4">{title}</h2>}
            {subtitle && <p className="text-muted-foreground text-lg">{subtitle}</p>}
          </div>
        )}
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>

        {products.length === 0 && (
          <div className="text-center py-20 bg-secondary/30 rounded-[3rem] border border-dashed border-border">
            <p className="text-muted-foreground font-medium">No products found matching your criteria.</p>
          </div>
        )}
      </div>
    </section>
  );
}
