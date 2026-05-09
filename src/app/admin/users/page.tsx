"use client";

import React, { useState, useEffect, useRef } from "react";
import { useAuth } from "@/context/AuthContext";
import { 
  ShieldCheck, 
  Search, 
  Mail,
  Phone,
  ChevronDown,
  UserCog,
  Users,
  Briefcase,
} from "lucide-react";
import { db } from "@/lib/firebase";
import { collection, query, getDocs, updateDoc, doc, orderBy } from "firebase/firestore";
import toast from "react-hot-toast";
import { cn } from "@/lib/utils";

type Role = "customer" | "agent" | "storefront_agent" | "admin" | "user" | "grievance_officer";

const ROLES: { value: Role; label: string; color: string }[] = [
  { value: "customer", label: "Customer", color: "bg-secondary text-muted-foreground" },
  { value: "agent", label: "Agent", color: "bg-blue-500/10 text-blue-600" },
  { value: "storefront_agent", label: "Storefront Agent", color: "bg-violet-500/10 text-violet-600" },
  { value: "grievance_officer", label: "Grievance Officer", color: "bg-amber-500/10 text-amber-600" },
  { value: "admin", label: "Admin", color: "bg-primary text-primary-foreground" },
];

function getRoleConfig(role: string) {
  return ROLES.find(r => r.value === role) ?? ROLES[0];
}

function RoleDropdown({ userId, currentRole, onChanged }: { userId: string; currentRole: string; onChanged: () => void }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [pendingRole, setPendingRole] = useState<Role | null>(null);
  const ref = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
        setPendingRole(null);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const selectRole = (role: Role) => {
    if (role === currentRole) { setOpen(false); return; }
    setPendingRole(role);
    setOpen(false);
  };

  const confirmChange = async () => {
    if (!pendingRole) return;
    setLoading(true);
    try {
      await updateDoc(doc(db, "users", userId), { role: pendingRole });
      toast.success(`Role updated to ${getRoleConfig(pendingRole).label}`);
      onChanged();
    } catch (err: any) {
      toast.error(err.message || "Failed to update role.");
    } finally {
      setLoading(false);
      setPendingRole(null);
    }
  };

  const cfg = getRoleConfig(currentRole);

  return (
    <div ref={ref} className="relative inline-block text-left">
      {/* Inline confirm banner */}
      {pendingRole && (
        <div className="absolute right-0 bottom-full mb-2 w-56 bg-background border border-border rounded-2xl shadow-2xl p-4 z-50">
          <p className="text-xs font-bold mb-3 text-center">
            Change role to <span className={cn("font-black", getRoleConfig(pendingRole).color.split(" ")[1])}>{getRoleConfig(pendingRole).label}</span>?
          </p>
          <div className="flex gap-2">
            <button
              id={`confirm-role-${userId}`}
              onClick={confirmChange}
              disabled={loading}
              className="flex-1 py-2 bg-primary text-primary-foreground rounded-xl text-[10px] font-black uppercase tracking-widest disabled:opacity-50"
            >
              {loading ? "Saving..." : "Confirm"}
            </button>
            <button
              onClick={() => setPendingRole(null)}
              className="flex-1 py-2 bg-secondary rounded-xl text-[10px] font-black uppercase tracking-widest"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      <button
        onClick={() => setOpen(o => !o)}
        disabled={loading}
        className={cn(
          "flex items-center gap-2 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all",
          cfg.color,
          "border-transparent hover:border-current disabled:opacity-50"
        )}
      >
        {loading ? "Saving..." : cfg.label}
        <ChevronDown className="w-3 h-3 opacity-60" />
      </button>

      {open && (
        <div className="absolute right-0 mt-1 w-44 bg-background border border-border rounded-2xl shadow-2xl overflow-hidden z-50">
          {ROLES.map(r => (
            <button
              key={r.value}
              id={`role-option-${r.value}-${userId}`}
              onClick={() => selectRole(r.value)}
              className={cn(
                "w-full flex items-center gap-3 px-4 py-3 text-xs font-black uppercase tracking-widest transition-colors text-left",
                r.value === currentRole
                  ? "bg-primary/10 text-primary"
                  : "hover:bg-secondary text-muted-foreground hover:text-foreground"
              )}
            >
              <span className={cn("w-2 h-2 rounded-full", r.color.split(" ")[0])} />
              {r.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default function AdminUsersPage() {
  const { profile } = useAuth();
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const q = query(collection(db, "users"), orderBy("createdAt", "desc"));
      const snapshot = await getDocs(q);
      setUsers(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch (err: any) {
      console.error(err);
      toast.error("Failed to fetch users. You may not have permission.");
    } finally {
      setLoading(false);
    }
  };



  const filteredUsers = users.filter(u =>
    u.displayName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.phoneNumber?.includes(searchTerm) ||
    u.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const adminCount = users.filter(u => u.role === "admin").length;
  const agentCount = users.filter(u => u.role === "agent" || u.role === "storefront_agent").length;

  return (
    <div className="max-w-7xl mx-auto px-4 py-12">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-12 gap-6">
          <div>
            <h1 className="text-4xl font-black tracking-tight">User Management</h1>
            <p className="text-muted-foreground mt-2">Manage roles — assign customers as agents or admins.</p>
          </div>
          <div className="flex gap-3">
            <div className="bg-primary/10 px-5 py-3 rounded-2xl flex items-center gap-2 border border-primary/20">
              <ShieldCheck className="w-4 h-4 text-primary" />
              <span className="font-black text-sm">{adminCount} Admin{adminCount !== 1 ? "s" : ""}</span>
            </div>
            <div className="bg-blue-500/10 px-5 py-3 rounded-2xl flex items-center gap-2 border border-blue-500/20">
              <Briefcase className="w-4 h-4 text-blue-600" />
              <span className="font-black text-sm text-blue-600">{agentCount} Agent{agentCount !== 1 ? "s" : ""}</span>
            </div>
            <div className="bg-secondary px-5 py-3 rounded-2xl flex items-center gap-2 border border-border">
              <Users className="w-4 h-4 text-muted-foreground" />
              <span className="font-black text-sm">{users.length} Total</span>
            </div>
          </div>
        </div>

        {/* Search */}
        <div className="relative mb-8">
          <Search className="absolute left-4 top-3.5 w-5 h-5 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search by name, phone, or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-3.5 bg-secondary/50 border border-border rounded-2xl outline-none focus:ring-2 focus:ring-primary transition-all font-bold"
          />
        </div>

        {/* Table */}
        <div className="bg-secondary/30 rounded-[3rem] border border-border overflow-hidden">
          {loading ? (
            <div className="p-20 text-center font-black animate-pulse">LOADING USERS...</div>
          ) : filteredUsers.length === 0 ? (
            <div className="p-20 text-center text-muted-foreground italic">No users found.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-background/50 border-b border-border">
                  <tr>
                    <th className="px-8 py-5 text-xs font-black uppercase tracking-widest">User</th>
                    <th className="px-8 py-5 text-xs font-black uppercase tracking-widest">Contact</th>
                    <th className="px-8 py-5 text-xs font-black uppercase tracking-widest text-center">Role</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filteredUsers.map((u) => {
                    const cfg = getRoleConfig(u.role);
                    return (
                      <tr key={u.id} className="hover:bg-background/40 transition-colors">
                        <td className="px-8 py-6">
                          <div className="flex items-center gap-4">
                            <div className={cn(
                              "w-12 h-12 rounded-xl flex items-center justify-center font-black text-xl shrink-0",
                              u.role === "admin"
                                ? "bg-primary text-primary-foreground"
                                : u.role === "agent" || u.role === "storefront_agent"
                                  ? "bg-blue-500/10 text-blue-600"
                                  : "bg-background border border-border"
                            )}>
                              {u.displayName?.[0]?.toUpperCase() || "?"}
                            </div>
                            <div>
                              <div className="font-black text-sm">{u.displayName || "Anonymous User"}</div>
                              <div className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">
                                Joined {u.createdAt?.toDate?.().toLocaleDateString() ?? "—"}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-8 py-6">
                          <div className="flex flex-col gap-1">
                            <div className="flex items-center gap-2 text-xs font-bold text-muted-foreground">
                              <Phone className="w-3 h-3" /> {u.phoneNumber ?? "—"}
                            </div>
                            {u.email && (
                              <div className="flex items-center gap-2 text-xs font-bold text-muted-foreground">
                                <Mail className="w-3 h-3" /> {u.email}
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-8 py-6 text-center">
                          <RoleDropdown
                            userId={u.id}
                            currentRole={u.role || "customer"}
                            onChanged={fetchUsers}
                          />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
  );
}
