"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { onAuthStateChanged, User } from "firebase/auth";
import { doc, getDoc, getDocFromCache, setDoc, updateDoc, serverTimestamp } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";

export type UserRole = "user" | "customer" | "admin" | "agent" | "storefront_agent" | "grievance_officer";

export interface UserProfile {
  uid: string;
  email: string | null;
  phoneNumber: string | null;
  displayName: string | null;
  role: UserRole;
  createdAt: any;
  updatedAt: any;
  referralCode?: string;
  agentId?: string;
  agentStatus?: "pending" | "active" | "rejected";
  agentAppliedAt?: any;
  agentJoinedAt?: any;
  status: "pending" | "approved" | "rejected" | "active";
  consent: {
    policies: boolean;
    promotional: boolean;
    timestamp: any;
    version: string;
  };
}

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  profile: null,
  loading: true,
});

// Check if a phone number belongs to the designated bootstrap admin
const isAdminPhone = (num: string | null): boolean => {
  if (!num) return false;
  return num.replace(/\D/g, "").endsWith("9392849473");
};

// Try to read a Firestore doc — falls back to local cache if server is unreachable
async function safeGetDoc(docRef: any) {
  try {
    return await getDoc(docRef);
  } catch (err) {
    console.warn("Firestore server unreachable, trying cache...", err);
    try {
      return await getDocFromCache(docRef);
    } catch (cacheErr) {
      console.error("Firestore cache also failed:", cacheErr);
      return null;
    }
  }
}

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);

      if (!firebaseUser) {
        setProfile(null);
        setLoading(false);
        return;
      }

      const docRef = doc(db, "users", firebaseUser.uid);
      const docSnap = await safeGetDoc(docRef);

      if (!docSnap) {
        // Both server and cache failed — can't determine role
        setProfile(null);
        setLoading(false);
        return;
      }

      if (docSnap.exists()) {
        const profileData = docSnap.data() as UserProfile;

        // Auto-elevate admin phone if role is not already admin
        if (
          (isAdminPhone(profileData.phoneNumber) || isAdminPhone(firebaseUser.phoneNumber)) &&
          profileData.role !== "admin"
        ) {
          updateDoc(docRef, { role: "admin" }).catch(console.error);
          profileData.role = "admin";
        }

        setProfile(profileData);
      } else if (isAdminPhone(firebaseUser.phoneNumber)) {
        // No Firestore profile yet — auto-create one for the admin phone
        try {
          const adminProfile = {
            uid: firebaseUser.uid,
            displayName: firebaseUser.displayName || "Admin",
            email: firebaseUser.email || null,
            phoneNumber: firebaseUser.phoneNumber,
            role: "admin" as UserRole,
            status: "active" as const,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
            consent: {
              policies: true,
              promotional: false,
              timestamp: serverTimestamp(),
              version: "1.0.0-2026-05",
            },
          };
          await setDoc(docRef, adminProfile);
          setProfile(adminProfile as unknown as UserProfile);
          console.log("Bootstrap admin profile created automatically");
        } catch (err) {
          console.error("Failed to auto-create admin profile:", err);
          setProfile(null);
        }
      } else {
        // Regular user with no profile — created during registration flow
        setProfile(null);
      }

      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return (
    <AuthContext.Provider value={{ user, profile, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
