"use client";

import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  User,
  Mail,
  ShieldCheck,
  UserPlus,
  Trash2,
  LogOut,
  Phone,
  MessageSquare,
  Smartphone,
  AlertCircle,
  Plus,
  X,
  Loader2,
  Lock,
  Edit,
} from "lucide-react";
import { createClient } from "@/utils/supabase/client";
import { useShop } from "@/app/context/ShopContext";
import PageLoader from "../components/PageLoader";
import { getAttendants, createAttendantUser, deleteAttendantUser } from "./actions";

// --- Custom Components ---

const StatusBadge = ({ role }) => {
  const roleStyles = {
    admin: "bg-purple-100 text-purple-700 border-purple-200",
    shop_owner: "bg-blue-100 text-blue-700 border-blue-200",
    shop_attendant: "bg-emerald-100 text-emerald-700 border-emerald-200",
    staff: "bg-slate-100 text-slate-700 border-slate-200",
  };
  const style = roleStyles[role] || roleStyles.staff;
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider border ${style}`}>
      {role?.replace("_", " ")}
    </span>
  );
};

const Card = ({ children, className = "" }) => (
  <div className={`bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden ${className}`}>
    {children}
  </div>
);

const SupportButton = ({ href, icon: Icon, label, color }) => (
  <a
    href={href}
    target="_blank"
    rel="noopener noreferrer"
    className={`flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-bold text-sm text-white transition-all duration-300 transform active:scale-95 shadow-md ${color}`}
  >
    <Icon size={18} />
    {label}
  </a>
);

const AccountPage = () => {
  const supabase = createClient();
  const { user, role } = useShop();
  
  const [attendants, setAttendants] = useState([]);
  const [loadingAttendants, setLoadingAttendants] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);

  // Form State
  const [newAttendant, setNewAttendant] = useState({
    name: "",
    email: "",
    password: "",
  });

  const fetchAttendants = useCallback(async () => {
    if (role === "shop_owner" || role === "admin") {
      setLoadingAttendants(true);
      try {
        const data = await getAttendants();
        setAttendants(data);
      } catch (err) {
        console.error("Failed to fetch attendants:", err);
      } finally {
        setLoadingAttendants(false);
      }
    }
  }, [role]);

  useEffect(() => {
    fetchAttendants();
  }, [fetchAttendants]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.href = "/auth";
  };

  const handleAddAttendant = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    try {
      await createAttendantUser(newAttendant);
      setShowAddModal(false);
      setNewAttendant({ name: "", email: "", password: "" });
      fetchAttendants();
    } catch (err) {
      setError(err.message || "Failed to create attendant");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteAttendant = async (userId) => {
    if (!confirm("Are you sure you want to remove this shop attendant? They will lose access immediately.")) return;
    
    try {
      await deleteAttendantUser(userId);
      fetchAttendants();
    } catch (err) {
      alert("Failed to delete attendant: " + err.message);
    }
  };

  if (!user) return <PageLoader />;

  const initials = user.user_metadata?.display_name
    ?.split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase() || user.email[0].toUpperCase();

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8 pt-20 md:pt-8 flex justify-center">
      <div className="w-full max-w-4xl space-y-8">
        
        {/* Profile Header */}
        <Card className="p-6 md:p-8 bg-gradient-to-br from-white to-slate-50">
          <div className="flex flex-col md:flex-row items-center gap-6">
            <div className="h-24 w-24 rounded-3xl bg-blue-600 flex items-center justify-center text-white text-3xl font-bold shadow-lg shadow-blue-200 ring-4 ring-white">
              {initials}
            </div>
            <div className="flex-1 text-center md:text-left space-y-1">
              <h1 className="text-3xl font-bold text-slate-900 tracking-tight">
                {user.user_metadata?.display_name || "Account Profile"}
              </h1>
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 text-slate-500">
                <span className="flex items-center gap-1.5 text-sm font-medium">
                  <Mail size={16} />
                  {user.email}
                </span>
                <span className="flex items-center gap-1.5 text-sm font-medium">
                  <ShieldCheck size={16} />
                  <StatusBadge role={role} />
                </span>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="mt-4 md:mt-0 flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold text-sm text-red-600 bg-red-50 hover:bg-red-100 transition-colors border border-red-100"
            >
              <LogOut size={18} />
              Log Out
            </button>
          </div>
        </Card>

        {/* Attendants Management Section */}
        {(role === "shop_owner" || role === "admin") && (
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                  <UserPlus className="text-blue-600" size={22} />
                  Shop Attendants
                </h2>
                <p className="text-sm text-slate-500 font-medium">Manage your team and their permissions</p>
              </div>
              <button
                onClick={() => setShowAddModal(true)}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl font-bold text-sm hover:bg-blue-700 transition-all shadow-md shadow-blue-100 active:scale-95"
              >
                <Plus size={18} />
                Add Attendant
              </button>
            </div>

            <Card>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-slate-50 border-b border-slate-100">
                    <tr>
                      <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Name</th>
                      <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {loadingAttendants ? (
                      <tr>
                        <td colSpan="2" className="px-6 py-12 text-center text-slate-400">
                          <Loader2 className="animate-spin h-6 w-6 mx-auto mb-2" />
                          Loading team...
                        </td>
                      </tr>
                    ) : attendants.length === 0 ? (
                      <tr>
                        <td colSpan="2" className="px-6 py-12 text-center text-slate-400 font-medium">
                          No attendants found. Add your first team member!
                        </td>
                      </tr>
                    ) : (
                      attendants.map((att) => (
                        <tr key={att.id} className="hover:bg-slate-50/50 transition-colors group">
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className="h-10 w-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-500 font-bold">
                                {att.display_name?.[0] || "A"}
                              </div>
                              <div>
                                <div className="text-sm font-bold text-slate-800">{att.display_name || "Attendant"}</div>
                                <div className="text-xs text-slate-400 font-medium tracking-tight">Access Level: Staff</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <button
                              onClick={() => handleDeleteAttendant(att.id)}
                              className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                              title="Remove Attendant"
                            >
                              <Trash2 size={18} />
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </Card>
          </section>
        )}

        {/* Support Section */}
        <section className="space-y-4">
          <div className="space-y-0.5">
            <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
              <MessageSquare className="text-blue-600" size={22} />
              Resource Center
            </h2>
            <p className="text-sm text-slate-500 font-medium">Need help? Our 24/7 support is here for you</p>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <SupportButton
              href="tel:+254703111438"
              icon={Phone}
              label="Call Support"
              color="bg-blue-600 hover:bg-blue-700 shadow-blue-100"
            />
            <SupportButton
              href="https://wa.me/254703111438"
              icon={Smartphone}
              label="WhatsApp"
              color="bg-emerald-600 hover:bg-emerald-700 shadow-emerald-100"
            />
            <SupportButton
              href="sms:+254703111438"
              icon={MessageSquare}
              label="Send SMS"
              color="bg-slate-800 hover:bg-slate-900 shadow-slate-200"
            />
          </div>
        </section>

      </div>

      {/* Add Attendant Modal */}
      <AnimatePresence>
        {showAddModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowAddModal(false)}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            />
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden"
            >
              <div className="bg-blue-600 p-6 text-white">
                <div className="flex justify-between items-center">
                  <h3 className="text-xl font-bold tracking-tight">Add New Attendant</h3>
                  <button onClick={() => setShowAddModal(false)} className="text-white/80 hover:text-white transition-colors">
                    <X size={24} />
                  </button>
                </div>
                <p className="text-blue-100 text-sm mt-1 font-medium">Create credentials for your team member</p>
              </div>

              <form onSubmit={handleAddAttendant} className="p-6 space-y-5">
                {error && (
                  <div className="p-4 bg-red-50 border border-red-100 rounded-xl flex items-start gap-3 text-red-600">
                    <AlertCircle size={20} className="shrink-0 mt-0.5" />
                    <p className="text-sm font-semibold leading-snug">{error}</p>
                  </div>
                )}

                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-widest pl-1">Full Name</label>
                  <div className="relative">
                    <User className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input
                      required
                      type="text"
                      className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-100 focus:border-blue-500 outline-none transition-all font-semibold"
                      placeholder="e.g. John Doe"
                      value={newAttendant.name}
                      onChange={(e) => setNewAttendant({ ...newAttendant, name: e.target.value })}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-widest pl-1">Email Address</label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input
                      required
                      type="email"
                      className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-100 focus:border-blue-500 outline-none transition-all font-semibold"
                      placeholder="attendant@irenesshop.com"
                      value={newAttendant.email}
                      onChange={(e) => setNewAttendant({ ...newAttendant, email: e.target.value })}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-widest pl-1">Temporary Password</label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input
                      required
                      type="password"
                      className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-100 focus:border-blue-500 outline-none transition-all font-semibold"
                      placeholder="Min. 6 characters"
                      value={newAttendant.password}
                      onChange={(e) => setNewAttendant({ ...newAttendant, password: e.target.value })}
                    />
                  </div>
                  <p className="text-[10px] text-slate-400 pl-1 font-medium">Pass these credentials to your attendant for their first login.</p>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-4 bg-blue-600 text-white rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-blue-700 transition-all shadow-lg shadow-blue-100 active:scale-95 disabled:bg-slate-200 disabled:shadow-none"
                >
                  {isSubmitting ? <Loader2 className="animate-spin" size={20} /> : "Create Attendant Account"}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AccountPage;
