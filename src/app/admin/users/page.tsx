"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import Navbar from "@/components/layout/Navbar";
import { 
  Users, 
  ShieldCheck, 
  UserPlus, 
  Search, 
  MoreVertical, 
  ShieldAlert,
  User,
  Mail,
  Phone
} from "lucide-react";
import { db } from "@/lib/firebase";
import { collection, query, getDocs, updateDoc, doc, orderBy } from "firebase/firestore";
import toast from "react-hot-toast";
import { cn } from "@/lib/utils";

export default function AdminUsersPage() {
  const { profile } = useAuth();
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const q = query(collection(db, "users"), orderBy("createdAt", "desc"));
      const snapshot = await getDocs(q);
      setUsers(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const toggleAdmin = async (userId: string, currentRole: string) => {
    const newRole = currentRole === "admin" ? "user" : "admin";
    const confirmMsg = newRole === "admin" 
      ? "Are you sure you want to make this user an ADMIN? They will have full control over the store." 
      : "Remove admin permissions from this user?";

    if (window.confirm(confirmMsg)) {
      try {
        await updateDoc(doc(db, "users", userId), { role: newRole });
        toast.success(`User role updated to ${newRole}`);
        fetchUsers();
      } catch (err: any) {
        toast.error(err.message);
      }
    }
  };

  const filteredUsers = users.filter(u => 
    u.displayName?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    u.phoneNumber?.includes(searchTerm)
  );

  return (
    <main className="min-h-screen bg-background">
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-12 gap-6">
          <div>
            <h1 className="text-4xl font-black tracking-tight">User Management</h1>
            <p className="text-muted-foreground mt-2">Manage your team permissions and elevate users to admin status.</p>
          </div>
          
          <div className="bg-primary/10 px-6 py-3 rounded-2xl flex items-center gap-2 border border-primary/20">
            <ShieldCheck className="w-5 h-5 text-primary" />
            <span className="font-black text-sm">{users.filter(u => u.role === 'admin').length} Admins Active</span>
          </div>
        </div>

        {/* Search & Stats */}
        <div className="relative mb-8">
          <Search className="absolute left-4 top-3.5 w-5 h-5 text-muted-foreground" />
          <input 
            type="text" 
            placeholder="Search by name or phone number..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-3.5 bg-secondary/50 border border-border rounded-2xl outline-none focus:ring-2 focus:ring-primary transition-all font-bold"
          />
        </div>

        {/* Users Table */}
        <div className="bg-secondary/30 rounded-[3rem] border border-border overflow-hidden">
          {loading ? (
            <div className="p-20 text-center font-black">LOADING USERS...</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-background/50 border-b border-border">
                  <tr>
                    <th className="px-8 py-5 text-xs font-black uppercase tracking-widest">User</th>
                    <th className="px-8 py-5 text-xs font-black uppercase tracking-widest">Contact</th>
                    <th className="px-8 py-5 text-xs font-black uppercase tracking-widest text-center">Current Role</th>
                    <th className="px-8 py-5 text-xs font-black uppercase tracking-widest text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filteredUsers.map((u) => (
                    <tr key={u.id} className="hover:bg-background/40 transition-colors">
                      <td className="px-8 py-6">
                        <div className="flex items-center gap-4">
                          <div className={cn(
                            "w-12 h-12 rounded-xl flex items-center justify-center font-black text-xl",
                            u.role === 'admin' ? "bg-primary text-primary-foreground" : "bg-background border border-border"
                          )}>
                            {u.displayName?.[0] || "?"}
                          </div>
                          <div>
                            <div className="font-black text-sm">{u.displayName || "Anonymous User"}</div>
                            <div className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">Joined {u.createdAt?.toDate().toLocaleDateString()}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-8 py-6">
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center gap-2 text-xs font-bold text-muted-foreground">
                            <Phone className="w-3 h-3" /> {u.phoneNumber}
                          </div>
                          {u.email && (
                            <div className="flex items-center gap-2 text-xs font-bold text-muted-foreground">
                              <Mail className="w-3 h-3" /> {u.email}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-8 py-6 text-center">
                        <span className={cn(
                          "px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest",
                          u.role === 'admin' ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20" : "bg-secondary text-muted-foreground"
                        )}>
                          {u.role || "User"}
                        </span>
                      </td>
                      <td className="px-8 py-6 text-right">
                        <button 
                          onClick={() => toggleAdmin(u.id, u.role)}
                          className={cn(
                            "px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                            u.role === 'admin' 
                              ? "bg-destructive/10 text-destructive hover:bg-destructive hover:text-white" 
                              : "bg-primary/10 text-primary hover:bg-primary hover:text-white"
                          )}
                        >
                          {u.role === 'admin' ? "Revoke Admin" : "Make Admin"}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
