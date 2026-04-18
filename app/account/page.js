"use client";

import Link from "next/link";
import {
  ArrowRight,
  LogOut,
  Mail,
  MessageSquare,
  Phone,
  ShieldCheck,
  Smartphone,
  Users,
} from "lucide-react";

import { createClient } from "@/utils/supabase/client";
import { useShop } from "@/app/context/ShopContext";
import PageLoader from "../components/PageLoader";

const StatusBadge = ({ role }) => {
  const roleStyles = {
    admin: "bg-purple-100 text-purple-700 border-purple-200",
    shop_owner: "bg-blue-100 text-blue-700 border-blue-200",
    shop_attendant: "bg-emerald-100 text-emerald-700 border-emerald-200",
    cashier: "bg-amber-100 text-amber-700 border-amber-200",
    stock_attendant: "bg-cyan-100 text-cyan-700 border-cyan-200",
    staff: "bg-slate-100 text-slate-700 border-slate-200",
  };

  const style = roleStyles[role] || roleStyles.staff;

  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-bold uppercase tracking-wider ${style}`}>
      {role?.replaceAll("_", " ")}
    </span>
  );
};

const Card = ({ children, className = "" }) => (
  <div className={`overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm ${className}`}>
    {children}
  </div>
);

const SupportButton = ({ href, icon: Icon, label, color }) => (
  <a
    href={href}
    target="_blank"
    rel="noopener noreferrer"
    className={`flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-bold text-white shadow-md transition-all duration-300 active:scale-95 ${color}`}
  >
    <Icon size={18} />
    {label}
  </a>
);

export default function AccountPage() {
  const supabase = createClient();
  const { user, role } = useShop();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.href = "/auth";
  };

  if (!user) {
    return <PageLoader />;
  }

  const initials =
    user.user_metadata?.display_name
      ?.split(" ")
      .map((name) => name[0])
      .join("")
      .toUpperCase() || user.email[0].toUpperCase();

  const canManageAttendants = role === "shop_owner" || role === "admin";

  return (
    <div className="flex min-h-screen justify-center bg-slate-50 p-4 pt-20 md:p-8 md:pt-8">
      <div className="w-full max-w-4xl space-y-8">
        <Card className="bg-gradient-to-br from-white to-slate-50 p-6 md:p-8">
          <div className="flex flex-col items-center gap-6 md:flex-row">
            <div className="flex h-24 w-24 items-center justify-center rounded-3xl bg-blue-600 text-3xl font-bold text-white shadow-lg shadow-blue-200 ring-4 ring-white">
              {initials}
            </div>
            <div className="flex-1 space-y-1 text-center md:text-left">
              <h1 className="text-3xl font-bold tracking-tight text-slate-900">
                {user.user_metadata?.display_name || "Account Profile"}
              </h1>
              <div className="flex flex-wrap items-center justify-center gap-4 text-slate-500 md:justify-start">
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
              className="mt-4 flex items-center gap-2 rounded-xl border border-red-100 bg-red-50 px-6 py-2.5 text-sm font-bold text-red-600 transition-colors hover:bg-red-100 md:mt-0"
            >
              <LogOut size={18} />
              Log Out
            </button>
          </div>
        </Card>

        {canManageAttendants && (
          <section className="space-y-4">
            <div className="space-y-0.5">
              <h2 className="flex items-center gap-2 text-xl font-bold text-slate-800">
                <Users className="text-blue-600" size={22} />
                Attendant Administration
              </h2>
              <p className="text-sm font-medium text-slate-500">
                Open the dedicated attendants page to create staff accounts, assign roles, and review access.
              </p>
            </div>

            <Card className="p-6 md:p-7">
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div className="max-w-2xl">
                  <p className="text-lg font-semibold text-slate-900">
                    Manage Irene&apos;s Shop staff from one place
                  </p>
                  <p className="mt-2 text-sm leading-6 text-slate-500">
                    Use the attendants workspace to create new attendants, assign their operational roles, and remove access when needed.
                  </p>
                </div>

                <Link
                  href="/attendants"
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-bold text-white transition-colors hover:bg-blue-700"
                >
                  Open Attendants
                  <ArrowRight size={18} />
                </Link>
              </div>
            </Card>
          </section>
        )}

        <section className="space-y-4">
          <div className="space-y-0.5">
            <h2 className="flex items-center gap-2 text-xl font-bold text-slate-800">
              <MessageSquare className="text-blue-600" size={22} />
              Resource Center
            </h2>
            <p className="text-sm font-medium text-slate-500">
              Need help? Support contact options for Irene&apos;s Shop are available here.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
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
    </div>
  );
}
