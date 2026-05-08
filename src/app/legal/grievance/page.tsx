"use client";

import React from "react";
import Navbar from "@/components/layout/Navbar";
import { 
  Scale, 
  Mail, 
  Phone, 
  MapPin, 
  Clock, 
  ShieldCheck,
  ChevronRight
} from "lucide-react";
import Link from "next/link";

export default function GrievancePage() {
  return (
    <main className="min-h-screen bg-background">
      <Navbar />

      <div className="max-w-4xl mx-auto px-4 py-20">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-black uppercase tracking-widest mb-6">
            <Scale className="w-5 h-5" />
            Compliance
          </div>
          <h1 className="text-5xl font-black tracking-tight mb-6">Grievance Redressal</h1>
          <p className="text-xl text-muted-foreground">
            In accordance with the Information Technology Act 2000 and the Consumer Protection (E-Commerce) Rules, 2020.
          </p>
        </div>

        <div className="bg-secondary/30 rounded-[3rem] border border-border overflow-hidden mb-12">
          <div className="p-10 lg:p-16 border-b border-border">
            <h2 className="text-3xl font-black mb-8">Nodal Grievance Officer</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
              <div className="space-y-8">
                <div className="flex gap-4">
                  <div className="w-12 h-12 bg-primary rounded-2xl flex items-center justify-center shrink-0">
                    <ShieldCheck className="w-6 h-6 text-primary-foreground" />
                  </div>
                  <div>
                    <div className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-1">Officer Name</div>
                    <div className="text-lg font-black">Mr. Kishore Kumar Mandava</div>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="w-12 h-12 bg-secondary rounded-2xl flex items-center justify-center shrink-0">
                    <Mail className="w-6 h-6 text-foreground" />
                  </div>
                  <div>
                    <div className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-1">Email Address</div>
                    <div className="text-lg font-black">grievance@bylyf.com</div>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="w-12 h-12 bg-secondary rounded-2xl flex items-center justify-center shrink-0">
                    <Phone className="w-6 h-6 text-foreground" />
                  </div>
                  <div>
                    <div className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-1">Contact Number</div>
                    <div className="text-lg font-black">+91 93928 49473</div>
                  </div>
                </div>
              </div>

              <div className="space-y-8">
                <div className="flex gap-4">
                  <div className="w-12 h-12 bg-secondary rounded-2xl flex items-center justify-center shrink-0">
                    <MapPin className="w-6 h-6 text-foreground" />
                  </div>
                  <div>
                    <div className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-1">Corporate Address</div>
                    <div className="text-lg font-black leading-relaxed">
                      BYLYF Storefront Pvt. Ltd.<br />
                      H-No: 1-2-3, Madhapur, Hyderabad,<br />
                      Telangana, India - 500081
                    </div>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="w-12 h-12 bg-secondary rounded-2xl flex items-center justify-center shrink-0">
                    <Clock className="w-6 h-6 text-foreground" />
                  </div>
                  <div>
                    <div className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-1">Working Hours</div>
                    <div className="text-lg font-black">Mon - Fri, 10:00 AM - 6:00 PM</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="p-10 lg:p-16 bg-primary/5">
            <h3 className="text-xl font-black mb-4">How to track your complaint?</h3>
            <p className="text-muted-foreground leading-relaxed mb-8">
              Once you raise a grievance, a unique ticket ID will be sent to your registered email and phone number within 48 hours. You can use this ID to track your complaint status on our platform.
            </p>
            <button className="px-8 py-4 bg-primary text-primary-foreground rounded-2xl font-bold flex items-center gap-2 hover:scale-105 transition-transform">
              Track Complaint Status
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Quick Links */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Terms", href: "/legal/terms" },
            { label: "Privacy", href: "/legal/privacy" },
            { label: "Refunds", href: "/legal/refund" },
            { label: "Shipping", href: "/legal/shipping" }
          ].map(link => (
            <Link 
              key={link.label} 
              href={link.href}
              className="p-6 bg-secondary/30 rounded-[2rem] text-center font-bold hover:bg-primary hover:text-primary-foreground transition-all"
            >
              {link.label}
            </Link>
          ))}
        </div>
      </div>
    </main>
  );
}
