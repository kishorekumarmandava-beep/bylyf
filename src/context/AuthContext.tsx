"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { onAuthStateChanged, User } from "firebase/auth";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";

export type UserRole = "user" | "admin" | "agent" | "storefront_agent";

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

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setUser(user);
      if (user) {
        const docRef = doc(db, "users", user.uid);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          setProfile(docSnap.data() as UserProfile);
        } else {
          // If profile doesn't exist, it will be created during registration
          setProfile(null);
        }
      } else {
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
