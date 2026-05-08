import React from "react";
import Navbar from "@/components/layout/Navbar";
import { 
  ShieldCheck, 
  Lock, 
  Eye, 
  Search, 
  CheckCircle2, 
  Zap,
  Globe,
  Award,
  Users
} from "lucide-react";

export default function TransparencyPage() {
  return (
    <main className="min-h-screen bg-background">
      <Navbar />

      {/* Hero Section */}
      <section className="pt-20 pb-32 bg-secondary/30 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 text-primary rounded-full text-xs font-black uppercase tracking-widest mb-8">
              <ShieldCheck className="w-4 h-4" />
              Transparency Report
            </div>
            <h1 className="text-5xl lg:text-7xl font-black tracking-tighter mb-8 leading-tight">
              Trust is our <br />
              <span className="text-primary italic">Only Currency.</span>
            </h1>
            <p className="text-xl text-muted-foreground leading-relaxed">
              At BYLYF, we believe transparency isn't just a policy—it's the foundation of everything we build. 
              Learn how we ensure fairness, security, and integrity in every transaction and lucky draw.
            </p>
          </div>
        </div>
      </section>

      {/* Core Principles */}
      <section className="py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                icon: <Lock className="w-8 h-8 text-primary" />,
                title: "Secure Transactions",
                desc: "We use industry-standard encryption and PCI-DSS compliant payment gateways to ensure your financial data never touches our servers."
              },
              {
                icon: <Eye className="w-8 h-8 text-primary" />,
                title: "Public Audits",
                desc: "Our lucky draw algorithms are audited by independent third-party firms to guarantee 100% randomness and fairness."
              },
              {
                icon: <Search className="w-8 h-8 text-primary" />,
                title: "Live Verification",
                desc: "Every coupon issued and every winner announced is recorded on a public ledger for anyone to verify at any time."
              }
            ].map((item, i) => (
              <div key={i} className="p-10 bg-secondary/20 rounded-[2.5rem] border border-border hover:border-primary/20 transition-all group">
                <div className="mb-6 p-4 bg-background rounded-2xl w-fit shadow-lg group-hover:scale-110 transition-transform">
                  {item.icon}
                </div>
                <h3 className="text-2xl font-black mb-4">{item.title}</h3>
                <p className="text-muted-foreground font-medium leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Lucky Draw Mechanics */}
      <section className="py-24 bg-primary text-primary-foreground rounded-[3rem] mx-4 lg:mx-8 mb-24 overflow-hidden relative">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(255,255,255,0.1)_0%,transparent_50%)]"></div>
        <div className="max-w-7xl mx-auto px-8 lg:px-16 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div>
              <h2 className="text-4xl lg:text-5xl font-black tracking-tighter mb-8">How we ensure fairness in Lucky Draws</h2>
              <div className="space-y-8">
                <div className="flex gap-6">
                  <div className="w-12 h-12 bg-white/10 rounded-2xl flex-shrink-0 flex items-center justify-center font-black">1</div>
                  <div>
                    <h4 className="text-xl font-bold mb-2">Threshold Based Triggers</h4>
                    <p className="text-primary-foreground/70">Draws are only triggered when the predefined number of coupons (e.g., 1000) is reached. No manual intervention is possible.</p>
                  </div>
                </div>
                <div className="flex gap-6">
                  <div className="w-12 h-12 bg-white/10 rounded-2xl flex-shrink-0 flex items-center justify-center font-black">2</div>
                  <div>
                    <h4 className="text-xl font-bold mb-2">Cryptographic Randomness</h4>
                    <p className="text-primary-foreground/70">We use verifiable random functions (VRF) to select winners, ensuring that neither BYLYF nor any participant can predict or manipulate the outcome.</p>
                  </div>
                </div>
                <div className="flex gap-6">
                  <div className="w-12 h-12 bg-white/10 rounded-2xl flex-shrink-0 flex items-center justify-center font-black">3</div>
                  <div>
                    <h4 className="text-xl font-bold mb-2">Instant Public Announcements</h4>
                    <p className="text-primary-foreground/70">As soon as a draw is completed, the winner's partial details (for privacy) and the winning coupon ID are broadcasted immediately.</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="relative">
              <div className="aspect-square bg-white/10 rounded-[3rem] border border-white/20 p-8 backdrop-blur-xl">
                <div className="h-full border border-white/10 rounded-[2rem] flex flex-col items-center justify-center text-center p-8">
                  <Award className="w-20 h-20 mb-6 text-white" />
                  <div className="text-3xl font-black mb-2">100% Audited</div>
                  <p className="text-primary-foreground/60 mb-8">Certified by Global Fairness Standards</p>
                  <div className="w-full h-1 bg-white/20 rounded-full overflow-hidden">
                    <div className="w-full h-full bg-white animate-pulse"></div>
                  </div>
                  <div className="mt-8 grid grid-cols-2 gap-4 w-full">
                    <div className="py-3 bg-white/5 rounded-xl text-xs font-bold uppercase tracking-widest">Randomness Test</div>
                    <div className="py-3 bg-white/5 rounded-xl text-xs font-bold uppercase tracking-widest">Logic Verified</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Commitment */}
      <section className="py-24">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <div className="w-20 h-20 bg-primary/10 text-primary rounded-3xl flex items-center justify-center mx-auto mb-8">
            <Users className="w-10 h-10" />
          </div>
          <h2 className="text-4xl font-black tracking-tighter mb-8">Our Commitment to India</h2>
          <p className="text-xl text-muted-foreground leading-relaxed mb-12">
            BYLYF is more than an ecommerce platform; it's a movement towards a more equitable digital economy. 
            We are committed to full compliance with Indian consumer protection laws and digital guidelines.
          </p>
          <div className="flex flex-wrap justify-center gap-8">
            <div className="flex items-center gap-2 font-black italic text-muted-foreground/50">
              <CheckCircle2 className="w-5 h-5 text-green-500" /> GST COMPLIANT
            </div>
            <div className="flex items-center gap-2 font-black italic text-muted-foreground/50">
              <CheckCircle2 className="w-5 h-5 text-green-500" /> DTI CERTIFIED
            </div>
            <div className="flex items-center gap-2 font-black italic text-muted-foreground/50">
              <CheckCircle2 className="w-5 h-5 text-green-500" /> PRIVACY FIRST
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
