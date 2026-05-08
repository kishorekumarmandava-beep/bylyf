"use client";

import React from "react";
import Navbar from "@/components/layout/Navbar";
import { ChevronLeft } from "lucide-react";
import Link from "next/link";

interface PolicyTemplateProps {
  title: string;
  lastUpdated: string;
  children: React.ReactNode;
}

export default function PolicyTemplate({ title, lastUpdated, children }: PolicyTemplateProps) {
  return (
    <main className="min-h-screen bg-background">
      <Navbar />

      <div className="max-w-4xl mx-auto px-4 py-20">
        <Link 
          href="/"
          className="inline-flex items-center gap-2 text-sm font-bold text-muted-foreground hover:text-primary mb-12 transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
          Back to Home
        </Link>

        <div className="mb-16">
          <h1 className="text-5xl lg:text-6xl font-black tracking-tighter mb-4">{title}</h1>
          <div className="flex items-center gap-4 text-muted-foreground">
            <div className="w-12 h-1 bg-primary rounded-full"></div>
            <span className="text-sm font-bold uppercase tracking-widest">Last Updated: {lastUpdated}</span>
          </div>
        </div>

        <div className="prose prose-invert max-w-none 
          prose-h2:text-3xl prose-h2:font-black prose-h2:tracking-tight prose-h2:mt-12 prose-h2:mb-6
          prose-p:text-muted-foreground prose-p:leading-relaxed prose-p:text-lg prose-p:mb-6
          prose-li:text-muted-foreground prose-li:text-lg prose-li:mb-2
          prose-strong:text-foreground prose-strong:font-black
        ">
          {children}
        </div>

        <div className="mt-24 p-12 bg-secondary/30 rounded-[3rem] border border-border text-center">
          <h3 className="text-2xl font-black mb-4">Questions about this policy?</h3>
          <p className="text-muted-foreground mb-8">If you have any questions or concerns regarding our policies, please contact our Nodal Officer.</p>
          <Link 
            href="/legal/grievance"
            className="px-8 py-4 bg-primary text-primary-foreground rounded-2xl font-bold inline-block hover:scale-105 transition-transform"
          >
            Contact Grievance Officer
          </Link>
        </div>
      </div>
    </main>
  );
}
