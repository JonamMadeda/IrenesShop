"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  ClipboardList,
  CreditCard,
  LayoutDashboard,
  LogOut,
  Menu,
  Package2,
  ReceiptText,
  ShieldUser,
  X,
} from "lucide-react";

import { createClient } from "@/utils/supabase/client";
import { useShop } from "@/app/context/ShopContext";

const navLinks = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Sales", href: "/sales", icon: CreditCard },
  { name: "Debt", href: "/debt", icon: ReceiptText },
  { name: "Stock Manager", href: "/stock-manager", icon: Package2 },
  { name: "Reports", href: "/reports", icon: BarChart3 },
  { name: "Account", href: "/account", icon: ShieldUser },
  { name: "Categories", href: "/categories", icon: ClipboardList },
];

function NavItem({ href, icon: Icon, label, active, onClick }) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className={[
        "flex items-center gap-3 rounded-xl px-3 py-2.5 transition-colors duration-200",
        active
          ? "bg-blue-900 text-white"
          : "text-slate-600 hover:bg-blue-50 hover:text-blue-900",
      ].join(" ")}
      aria-current={active ? "page" : undefined}
    >
      <Icon className="h-4.5 w-4.5 shrink-0" />
      <span className="text-sm font-medium">{label}</span>
    </Link>
  );
}

export default function Navbar() {
  const pathname = usePathname();
  const { role } = useShop();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [pathname]);

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    window.location.href = "/auth";
  };

  const roleColors = {
    admin: "bg-purple-100 text-purple-700 border-purple-200",
    shop_owner: "bg-blue-100 text-blue-700 border-blue-200",
    staff: "bg-emerald-100 text-emerald-700 border-emerald-200",
    shop_attendant: "bg-emerald-100 text-emerald-700 border-emerald-200",
  };

  const currentRoleColor = roleColors[role] || "bg-slate-100 text-slate-700 border-slate-200";

  const filteredNavLinks = navLinks.filter((link) => {
    // Hide Reports, Debt, and Categories for all users as requested
    if (["/reports", "/debt", "/categories"].includes(link.href)) {
      return false;
    }
    // Only admins/owners see Account
    if (role !== "admin" && role !== "shop_owner" && link.href === "/account") {
      return false;
    }
    return true;
  });

  return (
    <>
      <header className="fixed inset-x-0 top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur md:hidden">
        <div className="flex h-16 items-center justify-between px-4">
          <Link href="/dashboard" className="flex items-center gap-2.5">
            <span className="text-lg font-bold tracking-tight text-slate-900">IRENESSHOP</span>
            {role && (
              <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${currentRoleColor}`}>
                {role.replace('_', ' ')}
              </span>
            )}
          </Link>

          <button
            type="button"
            onClick={() => setIsMobileMenuOpen((current) => !current)}
            className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 transition-colors hover:bg-blue-50 hover:text-blue-900"
            aria-expanded={isMobileMenuOpen}
            aria-label={isMobileMenuOpen ? "Close navigation menu" : "Open navigation menu"}
          >
            {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>

        {isMobileMenuOpen && (
          <div className="border-t border-slate-200 bg-white px-4 pb-4 pt-3">
            <div className="space-y-2">
              {filteredNavLinks.map((link) => (
                <NavItem
                  key={link.href}
                  href={link.href}
                  icon={link.icon}
                  label={link.name}
                  active={pathname === link.href}
                  onClick={() => setIsMobileMenuOpen(false)}
                />
              ))}
              <button
                onClick={handleLogout}
                className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-red-600 transition-colors duration-200 hover:bg-red-50"
              >
                <LogOut className="h-4.5 w-4.5 shrink-0" />
                <span className="text-sm font-medium">Logout</span>
              </button>
            </div>
          </div>
        )}
      </header>

      <aside className="fixed left-0 top-0 z-30 hidden h-screen w-64 border-r border-slate-200 bg-white md:flex md:flex-col">
        <div className="border-b border-slate-200 px-6 py-5">
          <Link href="/dashboard" className="flex items-center gap-2.5">
            <span className="text-lg font-bold tracking-tight text-slate-900">IRENESSHOP</span>
            {role && (
              <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${currentRoleColor}`}>
                {role.replace('_', ' ')}
              </span>
            )}
          </Link>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-4">
          <nav className="space-y-1.5">
            {filteredNavLinks.map((link) => (
              <NavItem
                key={link.href}
                href={link.href}
                icon={link.icon}
                label={link.name}
                active={pathname === link.href}
              />
            ))}
          </nav>
        </div>

        <div className="border-t border-slate-200 p-4">
          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-red-600 transition-colors duration-200 hover:bg-red-50 hover:text-red-700"
          >
            <LogOut className="h-4.5 w-4.5 shrink-0" />
            <span className="text-sm font-medium">Logout</span>
          </button>
        </div>
      </aside>
    </>
  );
}
