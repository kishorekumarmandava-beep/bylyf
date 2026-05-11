"use client";

import React, { useState, useEffect } from "react";
import Navbar from "@/components/layout/Navbar";
import Link from "next/link";
import ProductGrid from "@/components/shop/ProductGrid";
import { ArrowRight, Zap, Shield, Sparkles, CheckCircle2 } from "lucide-react";
import { db } from "@/lib/firebase";
import { collection, query, orderBy, limit, getDocs } from "firebase/firestore";

export default function Home() {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const q = query(collection(db, "products"), orderBy("createdAt", "desc"), limit(8));
        const querySnapshot = await getDocs(q);
        const fetchedProducts = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setProducts(fetchedProducts);
      } catch (error) {
        console.error("Error fetching products:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  return (
    <main className="min-h-screen bg-background">
      <Navbar />
      
      {/* Hero Section */}
      <section className="relative pt-12 pb-20 lg:pt-24 lg:pb-32 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="lg:grid lg:grid-cols-12 lg:gap-16">
            <div className="lg:col-span-7 flex flex-col justify-center">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-black uppercase tracking-widest mb-8">
                <Zap className="w-5 h-5 fill-current" />
                Lucky Draw
              </div>
              <h1 className="text-5xl lg:text-7xl font-black tracking-tight leading-[1.1] mb-8 animate-in">
                Shop Smart. <br />
                <span className="text-primary/40 italic">Win Big.</span> <br />
                Only on <span className="text-primary">BYLYF.</span>
              </h1>
              <p className="text-xl text-muted-foreground mb-10 max-w-xl animate-in">
                Experience the next generation of ecommerce. Premium products, Lucky Draw, and a platform built for India's digital future.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 animate-in">
                <a 
                  href="#catalog"
                  className="px-8 py-5 bg-primary text-primary-foreground rounded-2xl font-bold text-lg flex items-center justify-center gap-2 shadow-2xl shadow-primary/30 hover:scale-[1.02] transition-all"
                >
                  Browse Catalog
                  <ArrowRight className="w-6 h-6" />
                </a>
                <Link 
                  href="/lucky-draw"
                  className="px-8 py-5 bg-secondary text-foreground rounded-2xl font-bold text-lg hover:bg-secondary/80 transition-all flex items-center justify-center"
                >
                  Learn About Bumper Draw
                </Link>
              </div>

              {/* Stats */}
              <div className="mt-16 grid grid-cols-3 gap-8 border-t border-border pt-8 animate-in">
                <div>
                  <div className="text-3xl font-black">10k+</div>
                  <div className="text-sm text-muted-foreground uppercase tracking-widest font-bold">Products</div>
                </div>
                <div>
                  <div className="text-3xl font-black">500+</div>
                  <div className="text-sm text-muted-foreground uppercase tracking-widest font-bold">Lucky Winners</div>
                </div>
                <div>
                  <div className="text-3xl font-black">1hr</div>
                  <div className="text-sm text-muted-foreground uppercase tracking-widest font-bold">Fast Support</div>
                </div>
              </div>
            </div>

            {/* Hero Image/Card Placeholder */}
            <div className="hidden lg:flex lg:col-span-5 relative mt-12 lg:mt-0 animate-in">
              <div className="w-full aspect-[4/5] bg-gradient-to-br from-primary/5 to-primary/20 rounded-[3rem] border border-primary/10 relative overflow-hidden group">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[150%] h-[150%] bg-[radial-gradient(circle_at_center,var(--primary)_0%,transparent_70%)] opacity-10 animate-pulse"></div>
                
                <div className="absolute inset-8 flex flex-col justify-between">
                  <div className="flex justify-between items-start">
                    <div className="p-4 bg-background/80 backdrop-blur-md rounded-2xl border border-border shadow-xl">
                      <Zap className="w-8 h-8 text-primary" />
                    </div>
                    <div className="px-6 py-3 bg-primary text-primary-foreground rounded-full font-black text-sm uppercase tracking-widest">
                      Bumper Draw Active
                    </div>
                  </div>
                  
                  <div className="p-8 bg-background/80 backdrop-blur-md rounded-[2rem] border border-border shadow-2xl transform group-hover:-translate-y-2 transition-transform">
                    <h3 className="text-2xl font-black mb-2">iPhone 16 Pro Max</h3>
                    <p className="text-muted-foreground mb-4">Enter the draw with any purchase over ₹999</p>
                    <div className="flex items-center gap-4">
                      <div className="flex -space-x-3">
                        {[1, 2, 3, 4].map((i: number) => (
                          <div key={i} className="w-10 h-10 rounded-full border-2 border-background bg-secondary"></div>
                        ))}
                      </div>
                      <span className="text-sm font-bold">+1,240 Participants</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Trust Badges */}
      <section className="py-12 bg-secondary/50 border-y border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-wrap justify-center gap-12 lg:gap-24 opacity-50 grayscale hover:grayscale-0 transition-all">
            <div className="flex items-center gap-2 font-black text-xl italic"><Shield className="w-6 h-6" /> SECURE PAY</div>
            <div className="flex items-center gap-2 font-black text-xl italic"><Zap className="w-6 h-6" /> FAST SHIP</div>
            <div className="flex items-center gap-2 font-black text-xl italic"><CheckCircle2 className="w-6 h-6" /> 100% GENUINE</div>
          </div>
        </div>
      </section>

      <section id="catalog" className="bg-background">
        {loading ? (
          <div className="py-20 text-center font-black italic text-muted-foreground">Loading Collection...</div>
        ) : (
          <ProductGrid 
            products={products} 
            title="Featured Collection" 
            subtitle="Discover our latest arrivals and top-rated products."
          />
        )}
      </section>

      {/* Categories Spotlight */}
      <section className="py-20 bg-primary text-primary-foreground overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-end mb-12 gap-8">
            <div className="max-w-2xl">
              <h2 className="text-5xl font-black tracking-tighter mb-4">Explore Categories</h2>
              <p className="text-primary-foreground/60 text-lg">From high-tech gadgets to digital mastery courses, find exactly what you need to upgrade your lifestyle.</p>
            </div>
            <button className="px-8 py-4 bg-background text-primary rounded-2xl font-bold hover:scale-105 transition-transform">
              View All Categories
            </button>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-8">
            {["Electronics", "Education", "Lifestyle", "Gaming"].map((cat: string) => (
              <div key={cat} className="aspect-square bg-white/5 rounded-[2.5rem] border border-white/10 p-8 flex flex-col justify-between hover:bg-white/10 transition-colors cursor-pointer group">
                <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Zap className="w-6 h-6" />
                </div>
                <h3 className="text-2xl font-black">{cat}</h3>
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
