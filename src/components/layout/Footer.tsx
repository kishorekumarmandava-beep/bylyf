"use client";

import React from "react";
import Link from "next/link";
import { 
  Mail, 
  Phone, 
  MapPin, 
  Heart,
  ShieldCheck,
  Zap,
  Globe,
  Award
} from "lucide-react";

export default function Footer() {
  return (
    <footer className="bg-secondary/30 border-t border-border pt-20 pb-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-16">
          {/* Brand Column */}
          <div className="space-y-6">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center">
                <span className="text-primary-foreground font-black text-xl italic">B</span>
              </div>
              <span className="text-2xl font-black tracking-tighter">BYLYF</span>
            </Link>
            <p className="text-muted-foreground text-sm leading-relaxed">
              India's premium shopping destination for physical and digital excellence. 
              Shop high-quality products and enter the most transparent lucky draws in the country.
            </p>
            <div className="flex gap-4">
              <a href="#" className="w-10 h-10 bg-secondary rounded-xl flex items-center justify-center hover:bg-primary hover:text-primary-foreground transition-all">
                <Globe className="w-5 h-5" />
              </a>
              <a href="#" className="w-10 h-10 bg-secondary rounded-xl flex items-center justify-center hover:bg-primary hover:text-primary-foreground transition-all">
                <Mail className="w-5 h-5" />
              </a>
              <a href="#" className="w-10 h-10 bg-secondary rounded-xl flex items-center justify-center hover:bg-primary hover:text-primary-foreground transition-all">
                <Phone className="w-5 h-5" />
              </a>
            </div>
          </div>

          {/* Shop Column */}
          <div>
            <h4 className="text-sm font-black uppercase tracking-[0.2em] mb-6">Shop</h4>
            <ul className="space-y-4 text-sm font-bold text-muted-foreground">
              <li><Link href="/#catalog" className="hover:text-primary transition-colors">Physical Store</Link></li>
              <li><Link href="/#catalog" className="hover:text-primary transition-colors">Digital Mastery</Link></li>
              <li><Link href="/categories" className="hover:text-primary transition-colors">Categories</Link></li>
              <li><Link href="/agent/apply" className="hover:text-primary transition-colors text-primary flex items-center gap-2">
                <Zap className="w-4 h-4 fill-current" /> Partner with Us
              </Link></li>
            </ul>
          </div>

          {/* Support Column */}
          <div>
            <h4 className="text-sm font-black uppercase tracking-[0.2em] mb-6">Support</h4>
            <ul className="space-y-4 text-sm font-bold text-muted-foreground">
              <li><Link href="/legal/grievance" className="hover:text-primary transition-colors">Grievance Redressal</Link></li>
              <li><Link href="/transparency" className="hover:text-primary transition-colors">Transparency Report</Link></li>
              <li><Link href="/help" className="hover:text-primary transition-colors">Help Center</Link></li>
              <li><Link href="/legal/refund" className="hover:text-primary transition-colors">Return & Replacement</Link></li>
              <li><Link href="/order-tracking" className="hover:text-primary transition-colors">Track Your Order</Link></li>
            </ul>
          </div>

          {/* Legal Column */}
          <div>
            <h4 className="text-sm font-black uppercase tracking-[0.2em] mb-6">Legal</h4>
            <ul className="space-y-4 text-sm font-bold text-muted-foreground">
              <li><Link href="/legal/terms" className="hover:text-primary transition-colors">Terms of Service</Link></li>
              <li><Link href="/legal/privacy" className="hover:text-primary transition-colors">Privacy Policy</Link></li>
              <li><Link href="/legal/refund" className="hover:text-primary transition-colors">Shipping Policy</Link></li>
              <li><Link href="/legal/refund" className="hover:text-primary transition-colors">Digital Product Policy</Link></li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-10 border-t border-border flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="flex flex-col items-center md:items-start gap-2">
            <div className="flex items-center gap-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground">
              <span className="flex items-center gap-1"><ShieldCheck className="w-3 h-3" /> PCI DSS SECURE</span>
              <span className="flex items-center gap-1"><Globe className="w-3 h-3" /> MADE IN INDIA</span>
            </div>
            <p className="text-sm text-muted-foreground">
              &copy; {new Date().getFullYear()} Martyzee (OPC) Private Limited. All rights reserved.
            </p>
          </div>

          <div className="flex items-center gap-6 opacity-40 grayscale hover:grayscale-0 transition-all">
            {/* Payment Icons Placeholder */}
            <div className="h-6 w-12 bg-muted rounded"></div>
            <div className="h-6 w-12 bg-muted rounded"></div>
            <div className="h-6 w-12 bg-muted rounded"></div>
            <div className="h-6 w-12 bg-muted rounded"></div>
          </div>

          <p className="text-xs text-muted-foreground flex items-center gap-1">
            Built with <Heart className="w-3 h-3 text-destructive fill-current" /> for India
          </p>
        </div>
      </div>
    </footer>
  );
}
