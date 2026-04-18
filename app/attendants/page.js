"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  AlertCircle,
  AlertTriangle,
  Loader2,
  Lock,
  Mail,
  Plus,
  ShieldCheck,
  Trash2,
  User,
  Users,
  X,
} from "lucide-react";

import PageLoader from "@/app/components/PageLoader";
import { useShop } from "@/app/context/ShopContext";
import { createAttendantUser, deleteAttendantUser, getAttendants } from "./actions";

const ROLE_OPTIONS = [
  { value: "shop_attendant", label: "Shop Attendant" },
  { value: "cashier", label: "Cashier" },
  { value: "stock_attendant", label: "Stock Attendant" },
];

const roleStyles = {
  shop_attendant: "bg-emerald-100 text-emerald-700 border-emerald-200",
  cashier: "bg-amber-100 text-amber-700 border-amber-200",
  stock_attendant: "bg-cyan-100 text-cyan-700 border-cyan-200",
  staff: "bg-slate-100 text-slate-700 border-slate-200",
};

const Card = ({ children, className = "" }) => (
  <div className={`overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm ${className}`}>
    {children}
  </div>
);

const RoleBadge = ({ role }) => {
  const style = roleStyles[role] || roleStyles.staff;

  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-bold uppercase tracking-wider ${style}`}>
      {String(role || "shop_attendant").replaceAll("_", " ")}
    </span>
  );
};

export default function AttendantsPage() {
  const { user, role, loading } = useShop();
  const [attendants, setAttendants] = useState([]);
  const [loadingAttendants, setLoadingAttendants] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [pendingDelete, setPendingDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    role: "shop_attendant",
  });

  const canManageAttendants = role === "shop_owner" || role === "admin";

  const fetchAttendants = useCallback(async () => {
    if (!canManageAttendants) {
      return;
    }

    setLoadingAttendants(true);
    try {
      const data = await getAttendants();
      setAttendants(data);
    } catch (fetchError) {
      console.error("Failed to fetch attendants:", fetchError);
      setError("We could not load the attendants list right now.");
    } finally {
      setLoadingAttendants(false);
    }
  }, [canManageAttendants]);

  useEffect(() => {
    fetchAttendants();
  }, [fetchAttendants]);

  const roleSummary = useMemo(() => {
    return attendants.reduce((summary, attendant) => {
      const currentRole = attendant.role || "shop_attendant";
      summary[currentRole] = (summary[currentRole] || 0) + 1;
      return summary;
    }, {});
  }, [attendants]);

  const handleCreateAttendant = async (event) => {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      await createAttendantUser(formData);
      setFormData({
        name: "",
        email: "",
        password: "",
        role: "shop_attendant",
      });
      setShowAddModal(false);
      await fetchAttendants();
    } catch (createError) {
      console.error("Failed to create attendant:", createError);
      setError(createError.message || "Failed to create attendant.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteAttendant = async () => {
    if (!pendingDelete) {
      return;
    }

    setIsDeleting(true);
    setError(null);

    try {
      await deleteAttendantUser(pendingDelete.id);
      setPendingDelete(null);
      await fetchAttendants();
    } catch (deleteError) {
      console.error("Failed to delete attendant:", deleteError);
      setError(deleteError.message || "Failed to remove attendant.");
    } finally {
      setIsDeleting(false);
    }
  };

  if (loading || !user) {
    return <PageLoader />;
  }

  if (!canManageAttendants) {
    return (
      <div className="min-h-screen bg-slate-50 p-4 pt-20 md:p-8 md:pt-8">
        <div className="mx-auto max-w-3xl">
          <Card className="p-8 md:p-10">
            <div className="flex items-start gap-4">
              <ShieldCheck className="mt-1 h-8 w-8 text-blue-600" />
              <div>
                <h1 className="text-2xl font-bold text-slate-900">Attendants page is restricted</h1>
                <p className="mt-3 text-sm leading-6 text-slate-600">
                  This page is only available to the shop owner account. Shop attendants can continue using the operational pages already assigned to them.
                </p>
              </div>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 p-4 pt-20 md:p-8 md:pt-8">
      <div className="mx-auto max-w-6xl space-y-8">
        <Card className="p-6 md:p-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl">
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-blue-600">
                Shop Owner Workspace
              </p>
              <h1 className="mt-3 text-3xl font-bold tracking-tight text-slate-900">
                Attendants
              </h1>
              <p className="mt-3 text-sm leading-6 text-slate-600">
                Create attendant accounts, assign operational roles, and review who currently has staff access to Irene&apos;s Shop.
              </p>
            </div>

            <button
              type="button"
              onClick={() => {
                setError(null);
                setShowAddModal(true);
              }}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-bold text-white transition-colors hover:bg-blue-700"
            >
              <Plus size={18} />
              Add Attendant
            </button>
          </div>
        </Card>

        <div className="grid gap-4 md:grid-cols-3">
          <Card className="p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
              Total Attendants
            </p>
            <p className="mt-3 text-3xl font-bold text-slate-900">{attendants.length}</p>
            <p className="mt-2 text-sm text-slate-500">Active staff accounts linked to this shop owner.</p>
          </Card>

          <Card className="p-5 md:col-span-2">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
              Roles in Use
            </p>
            <div className="mt-4 flex flex-wrap gap-3">
              {Object.keys(roleSummary).length === 0 ? (
                <p className="text-sm text-slate-500">No attendant roles assigned yet.</p>
              ) : (
                Object.entries(roleSummary).map(([roleName, count]) => (
                  <div key={roleName} className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
                    <RoleBadge role={roleName} />
                    <p className="mt-2 text-sm font-semibold text-slate-800">
                      {count} account{count > 1 ? "s" : ""}
                    </p>
                  </div>
                ))
              )}
            </div>
          </Card>
        </div>

        <Card>
          <div className="border-b border-slate-200 px-6 py-5">
            <div className="flex items-center gap-3">
              <Users className="h-5 w-5 text-blue-600" />
              <div>
                <h2 className="text-lg font-bold text-slate-900">Existing attendants</h2>
                <p className="text-sm text-slate-500">Review attendant accounts and their assigned roles.</p>
              </div>
            </div>
          </div>

          {error && (
            <div className="mx-6 mt-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
              {error}
            </div>
          )}

          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-6 py-4 text-xs font-bold uppercase tracking-widest text-slate-400">Name</th>
                  <th className="px-6 py-4 text-xs font-bold uppercase tracking-widest text-slate-400">Role</th>
                  <th className="px-6 py-4 text-xs font-bold uppercase tracking-widest text-slate-400">Updated</th>
                  <th className="px-6 py-4 text-right text-xs font-bold uppercase tracking-widest text-slate-400">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loadingAttendants ? (
                  <tr>
                    <td colSpan="4" className="px-6 py-12 text-center text-slate-400">
                      <Loader2 className="mx-auto mb-2 h-6 w-6 animate-spin" />
                      Loading attendants...
                    </td>
                  </tr>
                ) : attendants.length === 0 ? (
                  <tr>
                    <td colSpan="4" className="px-6 py-12 text-center text-slate-400">
                      No attendants found yet. Create the first attendant account to get started.
                    </td>
                  </tr>
                ) : (
                  attendants.map((attendant) => (
                    <tr key={attendant.id} className="hover:bg-slate-50/70">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-100 font-bold text-slate-600">
                            {(attendant.display_name || "A").charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="text-sm font-bold text-slate-900">
                              {attendant.display_name || "Attendant"}
                            </p>
                            <p className="text-xs text-slate-500">{attendant.id}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <RoleBadge role={attendant.role} />
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-500">
                        {attendant.updated_at
                          ? new Date(attendant.updated_at).toLocaleString()
                          : "Not available"}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          type="button"
                          onClick={() => setPendingDelete(attendant)}
                          className="inline-flex items-center justify-center rounded-lg p-2 text-slate-400 transition-colors hover:bg-red-50 hover:text-red-600"
                          title="Remove attendant"
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
      </div>

      <AnimatePresence>
        {showAddModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
              onClick={() => setShowAddModal(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 24 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 24 }}
              className="relative w-full max-w-lg rounded-3xl bg-white shadow-2xl"
            >
              <div className="flex items-center justify-between border-b border-slate-200 px-6 py-5">
                <div>
                  <h3 className="text-xl font-bold text-slate-900">Create attendant account</h3>
                  <p className="mt-1 text-sm text-slate-500">
                    Add a new staff member and assign their operational role.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
                >
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleCreateAttendant} className="space-y-5 p-6">
                {error && (
                  <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-red-700">
                    <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />
                    <p className="text-sm">{error}</p>
                  </div>
                )}

                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-widest text-slate-400">Full Name</label>
                  <div className="relative">
                    <User className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input
                      required
                      type="text"
                      value={formData.name}
                      onChange={(event) => setFormData((current) => ({ ...current, name: event.target.value }))}
                      className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-3 pl-11 pr-4 font-medium text-slate-900 outline-none transition-all focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                      placeholder="e.g. Jane Wanjiku"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-widest text-slate-400">Email Address</label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input
                      required
                      type="email"
                      value={formData.email}
                      onChange={(event) => setFormData((current) => ({ ...current, email: event.target.value }))}
                      className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-3 pl-11 pr-4 font-medium text-slate-900 outline-none transition-all focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                      placeholder="staff@irenesshop.com"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-widest text-slate-400">Role</label>
                  <select
                    value={formData.role}
                    onChange={(event) => setFormData((current) => ({ ...current, role: event.target.value }))}
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 font-medium text-slate-900 outline-none transition-all focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                  >
                    {ROLE_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-widest text-slate-400">Temporary Password</label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input
                      required
                      type="password"
                      value={formData.password}
                      onChange={(event) => setFormData((current) => ({ ...current, password: event.target.value }))}
                      className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-3 pl-11 pr-4 font-medium text-slate-900 outline-none transition-all focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                      placeholder="Minimum 6 characters"
                    />
                  </div>
                  <p className="text-xs text-slate-500">
                    Share these credentials securely with the attendant after account creation.
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-blue-600 px-5 py-3 text-sm font-bold text-white transition-colors hover:bg-blue-700 disabled:bg-slate-300"
                >
                  {isSubmitting ? <Loader2 className="h-5 w-5 animate-spin" /> : <Plus size={18} />}
                  Create Attendant
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {pendingDelete && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
              onClick={() => {
                if (!isDeleting) {
                  setPendingDelete(null);
                }
              }}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 24 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 24 }}
              className="relative w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl"
            >
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-red-50 text-red-600">
                  <AlertTriangle className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900">Confirm attendant deletion</h3>
                  <p className="mt-2 text-sm leading-6 text-slate-600">
                    Are you sure that you want to carry out this operation? This action is high-risk and permanent. The selected attendant account will lose access immediately, and deleted access details cannot be recovered after removal.
                  </p>
                </div>
              </div>

              <div className="mt-5 rounded-xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-sm font-semibold text-slate-900">
                  {pendingDelete.display_name || "Attendant"}
                </p>
                <div className="mt-2">
                  <RoleBadge role={pendingDelete.role} />
                </div>
              </div>

              <div className="mt-6 flex gap-3">
                <button
                  type="button"
                  onClick={() => setPendingDelete(null)}
                  disabled={isDeleting}
                  className="inline-flex flex-1 items-center justify-center rounded-xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50 disabled:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleDeleteAttendant}
                  disabled={isDeleting}
                  className="inline-flex flex-1 items-center justify-center rounded-xl bg-red-600 px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-red-700 disabled:bg-red-300"
                >
                  {isDeleting ? <Loader2 className="h-5 w-5 animate-spin" /> : "Confirm Deletion"}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
