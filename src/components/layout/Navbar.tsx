"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { auth, db } from "@/lib/firebase";
import { signOut } from "firebase/auth";
import { collection, getDocs } from "firebase/firestore";
import { Search, ShoppingCart, User, LogOut, Menu, X, Zap, ShieldCheck, Share2, Package } from "lucide-react";
import AuthModal from "@/components/auth/AuthModal";
import { cn } from "@/lib/utils";
import { AnimatePresence, motion } from "framer-motion";
import { mockProducts } from "@/data/mockProducts";
import { indexProducts, searchProducts } from "@/lib/search";
import { Product } from "@/types/product";
import { useCartStore } from "@/store/useCartStore";

export default function Navbar() {
  const { user, profile } = useAuth();
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  // Cart state with hydration fix
  const [cartCount, setCartCount] = useState(0);
  const totalItems = useCartStore((state) => state.getTotalItems());
  
  useEffect(() => {
    setCartCount(totalItems);
  }, [totalItems]);
  
  // Search state
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Product[]>([]);
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [dbProducts, setDbProducts] = useState<Product[]>([]);

  useEffect(() => {
    const fetchAndIndex = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, "products"));
        const productsList = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Product[];
        setDbProducts(productsList);
        indexProducts(productsList);
      } catch (error) {
        console.error("Error indexing products for search:", error);
      }
    };
    fetchAndIndex();
  }, []);

  useEffect(() => {
    if (searchQuery.length > 1) {
      const ids = searchProducts(searchQuery);
      const results = dbProducts.filter(p => ids.includes(p.id));
      setSearchResults(results);
    } else {
      setSearchResults([]);
    }
  }, [searchQuery, dbProducts]);

  const handleSignOut = () => {
    signOut(auth);
  };

  return (
    <nav className="sticky top-0 z-40 w-full bg-background/80 backdrop-blur-md border-b border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center">
              <span className="text-primary-foreground font-black text-xl italic">B</span>
            </div>
            <span className="text-2xl font-black tracking-tighter hidden sm:block">BYLYF</span>
          </Link>

          {/* Search Bar (Desktop) */}
          <div className="hidden md:flex flex-1 max-w-md mx-8 relative">
            <div className="relative w-full">
              <Search className={cn(
                "absolute left-4 top-3 w-5 h-5 transition-colors",
                isSearchFocused ? "text-primary" : "text-muted-foreground"
              )} />
              <input 
                type="text" 
                placeholder="Search products, brands, categories..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => setIsSearchFocused(true)}
                onBlur={() => setTimeout(() => setIsSearchFocused(false), 200)}
                className="w-full pl-12 pr-4 py-3 bg-secondary rounded-2xl border-none outline-none focus:ring-2 focus:ring-primary transition-all"
              />
            </div>

            {/* Search Results Dropdown */}
            <AnimatePresence>
              {isSearchFocused && searchQuery.length > 0 && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  className="absolute top-full left-0 right-0 mt-2 bg-background border border-border rounded-3xl shadow-2xl overflow-hidden p-2"
                >
                  {searchResults.length > 0 ? (
                    <div className="max-h-96 overflow-y-auto">
                      {searchResults.map((p) => (
                        <Link 
                          key={p.id} 
                          href={`/product/${p.slug}`}
                          className="flex items-center gap-4 p-3 hover:bg-secondary rounded-2xl transition-colors group"
                        >
                          <div className="w-12 h-12 bg-secondary rounded-xl overflow-hidden">
                            <img src={p.images[0]} alt={p.title} className="w-full h-full object-cover" />
                          </div>
                          <div className="flex-1">
                            <h4 className="font-bold text-sm line-clamp-1">{p.title}</h4>
                            <p className="text-xs text-muted-foreground">{p.brand} • ₹{p.sellingPrice.toLocaleString('en-IN')}</p>
                          </div>
                          {p.luckyDrawEligible && (
                            <Zap className="w-4 h-4 text-primary fill-current opacity-0 group-hover:opacity-100 transition-opacity" />
                          )}
                        </Link>
                      ))}
                    </div>
                  ) : (
                    <div className="p-8 text-center text-muted-foreground">
                      <p className="text-sm font-medium">No results found for "{searchQuery}"</p>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Desktop Actions */}
          <div className="hidden md:flex items-center gap-6">
            <Link href="/cart" className="relative p-2 hover:bg-secondary rounded-full transition-colors">
              <ShoppingCart className="w-6 h-6" />
              {cartCount > 0 && (
                <span className="absolute top-0 right-0 w-5 h-5 bg-primary text-primary-foreground text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-background animate-in">
                  {cartCount}
                </span>
              )}
            </Link>

            {user ? (
              <div className="flex items-center gap-4">
                {profile?.role === "admin" && (
                  <Link href="/admin/users" className="flex items-center gap-2 px-4 py-2 bg-primary/10 text-primary rounded-full hover:bg-primary/20 transition-all font-bold text-xs uppercase tracking-widest">
                    <ShieldCheck className="w-4 h-4" />
                    Dashboard
                  </Link>
                )}
                {profile?.role === "agent" && (
                  <Link href="/agent/referral" className="flex items-center gap-2 px-4 py-2 bg-blue-500/10 text-blue-600 rounded-full hover:bg-blue-500/20 transition-all font-bold text-xs uppercase tracking-widest">
                    <Share2 className="w-4 h-4" />
                    Referral Portal
                  </Link>
                )}
                {profile?.role === "storefront_agent" && (
                  <Link href="/agent/storefront" className="flex items-center gap-2 px-4 py-2 bg-violet-500/10 text-violet-600 rounded-full hover:bg-violet-500/20 transition-all font-bold text-xs uppercase tracking-widest">
                    <Package className="w-4 h-4" />
                    Storefront Portal
                  </Link>
                )}
                <Link href="/profile" className="flex items-center gap-3 p-1 pr-4 bg-secondary rounded-full hover:opacity-80 transition-opacity">
                  <div className="w-8 h-8 bg-primary/10 text-primary rounded-full flex items-center justify-center">
                    <User className="w-5 h-5" />
                  </div>
                  <span className="text-sm font-semibold">{profile?.displayName || "User"}</span>
                </Link>
                <button 
                  onClick={handleSignOut}
                  className="p-2 text-muted-foreground hover:text-destructive transition-colors"
                >
                  <LogOut className="w-5 h-5" />
                </button>
              </div>
            ) : (
              <button 
                onClick={() => setIsAuthModalOpen(true)}
                className="px-6 py-3 bg-primary text-primary-foreground rounded-2xl font-bold shadow-lg hover:shadow-primary/20 transition-all active:scale-95"
              >
                Sign In
              </button>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden flex items-center gap-4">
            <Link href="/cart" className="relative p-2">
              <ShoppingCart className="w-6 h-6" />
              {cartCount > 0 && (
                <span className="absolute top-0 right-0 w-5 h-5 bg-primary text-primary-foreground text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-background animate-in">
                  {cartCount}
                </span>
              )}
            </Link>
            <button 
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-2 bg-secondary rounded-xl"
            >
              {isMobileMenuOpen ? <X /> : <Menu />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden bg-background border-b border-border overflow-hidden"
          >
            <div className="px-4 py-6 space-y-4">
              <div className="relative">
                <Search className="absolute left-4 top-3 w-5 h-5 text-muted-foreground" />
                <input 
                  type="text" 
                  placeholder="Search BYLYF..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onFocus={() => setIsSearchFocused(true)}
                  onBlur={() => setTimeout(() => setIsSearchFocused(false), 200)}
                  className="w-full pl-12 pr-4 py-3 bg-secondary rounded-2xl border-none outline-none"
                />

                {/* Mobile Search Results Dropdown */}
                <AnimatePresence>
                  {isSearchFocused && searchQuery.length > 0 && (
                    <motion.div 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                      className="absolute top-full left-0 right-0 mt-2 bg-background border border-border rounded-3xl shadow-2xl overflow-hidden p-2 z-50"
                    >
                      {searchResults.length > 0 ? (
                        <div className="max-h-96 overflow-y-auto">
                          {searchResults.map((p) => (
                            <Link 
                              key={p.id} 
                              href={`/product/${p.slug}`}
                              onClick={() => setIsMobileMenuOpen(false)}
                              className="flex items-center gap-4 p-3 hover:bg-secondary rounded-2xl transition-colors group"
                            >
                              <div className="w-12 h-12 bg-secondary rounded-xl overflow-hidden">
                                <img src={p.images[0]} alt={p.title} className="w-full h-full object-cover" />
                              </div>
                              <div className="flex-1">
                                <h4 className="font-bold text-sm line-clamp-1">{p.title}</h4>
                                <p className="text-xs text-muted-foreground">{p.brand} • ₹{p.sellingPrice.toLocaleString('en-IN')}</p>
                              </div>
                            </Link>
                          ))}
                        </div>
                      ) : (
                        <div className="p-8 text-center text-muted-foreground">
                          <p className="text-sm font-medium">No results found for "{searchQuery}"</p>
                        </div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <Link href="/shop" className="p-4 bg-secondary rounded-2xl text-center font-semibold">Shop</Link>
                <Link href="/categories" className="p-4 bg-secondary rounded-2xl text-center font-semibold">Categories</Link>
              </div>
              {!user ? (
                <button 
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    setIsAuthModalOpen(true);
                  }}
                  className="w-full py-4 bg-primary text-primary-foreground rounded-2xl font-bold"
                >
                  Sign In
                </button>
              ) : (
                <div className="flex flex-col gap-3 pt-4 border-t border-border">
                  <Link href="/profile" onClick={() => setIsMobileMenuOpen(false)} className="flex items-center gap-3 p-3 bg-secondary rounded-2xl">
                    <div className="w-10 h-10 bg-primary/10 text-primary rounded-xl flex items-center justify-center">
                      <User className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="font-semibold">{profile?.displayName || "User"}</p>
                      <p className="text-xs text-muted-foreground capitalize">{profile?.role || "Customer"}</p>
                    </div>
                  </Link>

                  {profile?.role === "admin" && (
                    <Link href="/admin/users" onClick={() => setIsMobileMenuOpen(false)} className="flex items-center gap-3 p-3 bg-primary/5 text-primary rounded-2xl font-semibold">
                      <ShieldCheck className="w-5 h-5" />
                      Admin Dashboard
                    </Link>
                  )}
                  {profile?.role === "agent" && (
                    <Link href="/agent/referral" onClick={() => setIsMobileMenuOpen(false)} className="flex items-center gap-3 p-3 bg-blue-500/5 text-blue-600 rounded-2xl font-semibold">
                      <Share2 className="w-5 h-5" />
                      Referral Portal
                    </Link>
                  )}
                  {profile?.role === "storefront_agent" && (
                    <Link href="/agent/storefront" onClick={() => setIsMobileMenuOpen(false)} className="flex items-center gap-3 p-3 bg-violet-500/5 text-violet-600 rounded-2xl font-semibold">
                      <Package className="w-5 h-5" />
                      Storefront Portal
                    </Link>
                  )}

                  <button 
                    onClick={() => {
                      setIsMobileMenuOpen(false);
                      handleSignOut();
                    }}
                    className="flex items-center gap-3 p-3 text-destructive bg-destructive/5 rounded-2xl font-semibold mt-2"
                  >
                    <LogOut className="w-5 h-5" />
                    Sign Out
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AuthModal 
        isOpen={isAuthModalOpen} 
        onClose={() => setIsAuthModalOpen(false)} 
      />
    </nav>
  );
}
