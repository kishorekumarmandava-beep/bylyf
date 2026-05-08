"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { auth } from "@/lib/firebase";
import { signOut } from "firebase/auth";
import { Search, ShoppingCart, User, LogOut, Menu, X, Zap } from "lucide-react";
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

  useEffect(() => {
    // Index mock products on mount
    indexProducts(mockProducts);
  }, []);

  useEffect(() => {
    if (searchQuery.length > 1) {
      const ids = searchProducts(searchQuery);
      const results = mockProducts.filter(p => ids.includes(p.id));
      setSearchResults(results);
    } else {
      setSearchResults([]);
    }
  }, [searchQuery]);

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
                  className="w-full pl-12 pr-4 py-3 bg-secondary rounded-2xl border-none outline-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <Link href="/shop" className="p-4 bg-secondary rounded-2xl text-center font-semibold">Shop</Link>
                <Link href="/categories" className="p-4 bg-secondary rounded-2xl text-center font-semibold">Categories</Link>
              </div>
              {!user && (
                <button 
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    setIsAuthModalOpen(true);
                  }}
                  className="w-full py-4 bg-primary text-primary-foreground rounded-2xl font-bold"
                >
                  Sign In
                </button>
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
