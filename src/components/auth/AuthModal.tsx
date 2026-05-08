"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  RecaptchaVerifier, 
  signInWithPhoneNumber, 
  ConfirmationResult,
  updateProfile,
  sendEmailVerification
} from "firebase/auth";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { cn } from "@/lib/utils";
import { Phone, Mail, ArrowRight, ShieldCheck, CheckCircle2, X } from "lucide-react";
import toast from "react-hot-toast";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const POLICY_VERSION = "1.0.0-2026-05";

export default function AuthModal({ isOpen, onClose }: AuthModalProps) {
  const [step, setStep] = useState<"phone" | "otp" | "profile">("phone");
  const [phoneNumber, setPhoneNumber] = useState("+91 ");
  const [otp, setOtp] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null);
  const [loading, setLoading] = useState(false);
  
  // Consent states
  const [consentPolicies, setConsentPolicies] = useState(false);
  const [consentPromotional, setConsentPromotional] = useState(false);

  // Handle Recaptcha cleanup on unmount or close
  useEffect(() => {
    if (!isOpen) {
      if (window.recaptchaVerifier) {
        try {
          window.recaptchaVerifier.clear();
          window.recaptchaVerifier = undefined;
        } catch (e) {
          console.error("Recaptcha cleanup error:", e);
        }
      }
      setStep("phone");
      setLoading(false);
    }
  }, [isOpen]);

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phoneNumber.trim().startsWith("+91") || phoneNumber.trim().length < 13) {
      toast.error("Please enter a valid Indian phone number (+91 XXXXX XXXXX)");
      return;
    }
    setLoading(true);

    try {
      // 1. Thoroughly clear existing instance
      if (window.recaptchaVerifier) {
        try {
          window.recaptchaVerifier.clear();
        } catch (e) {}
        window.recaptchaVerifier = undefined;
      }

      // 2. Initialize fresh recaptcha with a small delay to ensure DOM is ready
      const container = document.getElementById("recaptcha-container");
      if (!container) {
        throw new Error("Recaptcha container not found in DOM");
      }
      
      // Clear container children just in case
      container.innerHTML = "";

      window.recaptchaVerifier = new RecaptchaVerifier(auth, "recaptcha-container", {
        size: "invisible",
        callback: () => {
          console.log("reCAPTCHA solved");
        }
      });

      // Strip all spaces for Firebase
      const formattedPhone = phoneNumber.replace(/\s+/g, '');
      const confirmation = await signInWithPhoneNumber(auth, formattedPhone, window.recaptchaVerifier);
      setConfirmationResult(confirmation);
      setStep("otp");
      toast.success("OTP sent successfully!");
    } catch (error: any) {
      console.error("Auth Error:", error);
      
      if (error.code === "auth/invalid-phone-number") {
        toast.error("Invalid phone number format.");
      } else if (error.code === "auth/too-many-requests") {
        toast.error("Too many attempts. Please try again later.");
      } else {
        toast.error(error.message || "Failed to send OTP.");
      }
      
      // Reset on error
      if (window.recaptchaVerifier) {
        try { window.recaptchaVerifier.clear(); } catch(e) {}
        window.recaptchaVerifier = undefined;
      }
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const result = await confirmationResult!.confirm(otp);
      const user = result.user;
      
      // Check if user already has a profile
      if (user.displayName) {
        toast.success("Welcome back!");
        onClose();
      } else {
        setStep("profile");
      }
    } catch (error: any) {
      toast.error("Invalid OTP");
    } finally {
      setLoading(false);
    }
  };

  const handleCompleteProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!consentPolicies) {
      toast.error("You must accept the terms and policies to continue.");
      return;
    }
    setLoading(true);
    try {
      const user = auth.currentUser;
      if (!user) throw new Error("No user session found. Please try logging in again.");

      // Data to save
      const profileData = {
        uid: user.uid,
        displayName,
        email,
        phoneNumber: user.phoneNumber,
        role: "customer",
        status: "active",
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        consent: {
          policies: consentPolicies,
          promotional: consentPromotional,
          timestamp: serverTimestamp(),
          version: POLICY_VERSION,
        }
      };

      const auditLogData = {
        type: "consent",
        userId: user.uid,
        policiesAccepted: consentPolicies,
        promotionalAccepted: consentPromotional,
        policyVersion: POLICY_VERSION,
        timestamp: serverTimestamp(),
        ip: "client-side-logged",
      };

      // Run all writes in parallel for speed
      await Promise.all([
        updateProfile(user, { displayName }),
        setDoc(doc(db, "users", user.uid), profileData),
        setDoc(doc(db, "audit_logs", `consent_${user.uid}_${Date.now()}`), auditLogData)
      ]);

      // Handle email verification separately (doesn't block completion)
      if (email) {
        sendEmailVerification(user).catch(err => console.error("Email verification error:", err));
        toast.success("Profile saved! Check your email for verification.");
      } else {
        toast.success("Welcome to BYLYF!");
      }
      
      onClose();
      window.location.reload(); // Refresh to update Auth state globally
    } catch (error: any) {
      console.error("Profile Setup Error:", error);
      toast.error(error.message || "An error occurred during setup.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="w-full max-w-md bg-background rounded-3xl shadow-2xl overflow-hidden border border-border"
          >
            <div className="relative p-8">
              <button 
                onClick={onClose}
                className="absolute top-4 right-4 p-2 rounded-full hover:bg-secondary transition-colors"
              >
                <X className="w-5 h-5 text-muted-foreground" />
              </button>

              <div className="mb-8 text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary text-primary-foreground mb-4 shadow-lg">
                  <ShieldCheck className="w-8 h-8" />
                </div>
                <h2 className="text-2xl font-bold tracking-tight">BYLYF Secure Access</h2>
                <p className="text-muted-foreground mt-2">Join India's premium shopping experience</p>
              </div>

              {step === "phone" && (
                <form onSubmit={handleSendOtp} className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-sm font-medium ml-1">Phone Number</label>
                    <div className="relative">
                      <Phone className="absolute left-4 top-3.5 w-5 h-5 text-muted-foreground" />
                      <input 
                        type="tel"
                        placeholder="+91 98765 43210"
                        value={phoneNumber}
                        onChange={(e) => setPhoneNumber(e.target.value)}
                        className="w-full pl-12 pr-4 py-3.5 bg-secondary border-none rounded-2xl focus:ring-2 focus:ring-primary transition-all outline-none"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-4 border-t border-border pt-6">
                    <div className="flex gap-3">
                      <input 
                        type="checkbox"
                        id="consent-policies-main"
                        checked={consentPolicies}
                        onChange={(e) => setConsentPolicies(e.target.checked)}
                        className="mt-1 w-5 h-5 accent-primary cursor-pointer"
                      />
                      <label htmlFor="consent-policies-main" className="text-sm text-muted-foreground leading-relaxed cursor-pointer">
                        I agree to the <span className="text-primary font-medium hover:underline">Terms of Service</span>, 
                        <span className="text-primary font-medium hover:underline"> Privacy Policy</span>, and 
                        <span className="text-primary font-medium hover:underline"> Refund/Shipping Policies</span>.
                      </label>
                    </div>

                    <div className="flex gap-3">
                      <input 
                        type="checkbox"
                        id="consent-promo-main"
                        checked={consentPromotional}
                        onChange={(e) => setConsentPromotional(e.target.checked)}
                        className="mt-1 w-5 h-5 accent-primary cursor-pointer"
                      />
                      <label htmlFor="consent-promo-main" className="text-sm text-muted-foreground leading-relaxed cursor-pointer">
                        I consent to receive updates via WhatsApp, Email, and SMS.
                      </label>
                    </div>
                  </div>

                  <div id="recaptcha-container"></div>
                  <button 
                    disabled={loading || !consentPolicies}
                    className="w-full py-4 bg-primary text-primary-foreground rounded-2xl font-semibold flex items-center justify-center gap-2 hover:opacity-90 transition-opacity disabled:opacity-50"
                  >
                    {loading ? "Sending..." : "Send OTP"}
                    <ArrowRight className="w-5 h-5" />
                  </button>
                  <p className="text-[10px] text-center text-muted-foreground">
                    Note: Ensure Phone Auth is enabled in Firebase Console.
                  </p>
                </form>
              )}

              {step === "otp" && (
                <form onSubmit={handleVerifyOtp} className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium ml-1">Verification Code</label>
                    <input 
                      type="text"
                      placeholder="Enter 6-digit OTP"
                      value={otp}
                      onChange={(e) => setOtp(e.target.value)}
                      className="w-full px-4 py-3.5 bg-secondary border-none rounded-2xl focus:ring-2 focus:ring-primary transition-all outline-none text-center text-xl tracking-[0.5em] font-bold"
                      maxLength={6}
                      required
                    />
                  </div>
                  <button 
                    disabled={loading}
                    className="w-full py-4 bg-primary text-primary-foreground rounded-2xl font-semibold hover:opacity-90 transition-opacity disabled:opacity-50"
                  >
                    {loading ? "Verifying..." : "Verify & Continue"}
                  </button>
                  <button 
                    type="button"
                    onClick={() => setStep("phone")}
                    className="w-full text-sm text-muted-foreground hover:text-primary transition-colors"
                  >
                    Change phone number
                  </button>
                </form>
              )}

              {step === "profile" && (
                <form onSubmit={handleCompleteProfile} className="space-y-6">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium ml-1">Full Name</label>
                      <input 
                        type="text"
                        placeholder="Your Name"
                        value={displayName}
                        onChange={(e) => setDisplayName(e.target.value)}
                        className="w-full px-4 py-3.5 bg-secondary border-none rounded-2xl focus:ring-2 focus:ring-primary transition-all outline-none"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium ml-1">Email Address (Optional)</label>
                      <div className="relative">
                        <Mail className="absolute left-4 top-3.5 w-5 h-5 text-muted-foreground" />
                        <input 
                          type="email"
                          placeholder="email@example.com"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          className="w-full pl-12 pr-4 py-3.5 bg-secondary border-none rounded-2xl focus:ring-2 focus:ring-primary transition-all outline-none"
                        />
                      </div>
                    </div>
                  </div>

                  <button 
                    disabled={loading}
                    className="w-full py-4 bg-primary text-primary-foreground rounded-2xl font-semibold hover:opacity-90 transition-opacity disabled:opacity-50"
                  >
                    {loading ? "Setting up..." : "Complete Setup"}
                  </button>
                </form>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

declare global {
  interface Window {
    recaptchaVerifier: RecaptchaVerifier | undefined;
  }
}
