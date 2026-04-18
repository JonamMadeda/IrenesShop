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
  Users,
  X,
  ChevronRight,
  TrendingUp,
} from "lucide-react";

import { createClient } from "@/utils/supabase/client";
import { useShop } from "@/app/context/ShopContext";

const navGroups = [
  {
    title: "Overview",
    links: [
      { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    ],
  },
  {
    title: "Operations",
    links: [
      { name: "Sales", href: "/sales", icon: CreditCard },
      { name: "Debt Tracker", href: "/debt", icon: ReceiptText },
      { name: "Stock Manager", href: "/stock-manager", icon: Package2 },
    ],
  },
  {
    title: "Analysis",
    links: [
      { name: "Reports", href: "/reports", icon: BarChart3 },
    ],
  },
  {
    title: "Administration",
    links: [
      { name: "Attendants", href: "/attendants", icon: Users },
      { name: "System Logs", href: "/logs", icon: ClipboardList },
      { name: "Settings", href: "/account", icon: ShieldUser },
    ],
  },
];

function NavItem({ href, icon: Icon, label, active, onClick }) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className={`group relative flex items-center gap-3 rounded-xl px-3 py-2.5 transition-all duration-200 ${
        active
          ? "bg-blue-900 text-white shadow-md shadow-blue-100"
          : "text-slate-600 hover:bg-blue-50 hover:text-blue-900"
      }`}
      aria-current={active ? "page" : undefined}
    >
      {active && (
        <span className="absolute left-0 top-1/2 -translate-y-1/2 h-6 w-1 rounded-r-full bg-blue-300" />
      )}
      <Icon className={`h-5 w-5 shrink-0 transition-transform duration-200 ${active ? "scale-110" : "group-hover:scale-110"}`} />
      <span className={`text-sm tracking-tight ${active ? "font-bold" : "font-medium"}`}>{label}</span>
      {active && <ChevronRight className="ml-auto h-4 w-4 opacity-50" />}
    </Link>
  );
}

function SectionHeader({ children }) {
  return (
    <p className="px-3 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 mb-2 mt-6 first:mt-2">
      {children}
    </p>
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
    admin: "bg-purple-50 text-purple-700 border-purple-100",
    shop_owner: "bg-blue-50 text-blue-700 border-blue-100",
    staff: "bg-emerald-50 text-emerald-700 border-emerald-100",
    shop_attendant: "bg-emerald-50 text-emerald-700 border-emerald-100",
  };

  const currentRoleColor = roleColors[role] || "bg-slate-50 text-slate-600 border-slate-100";

  const getFilteredGroups = () => {
    return navGroups.map(group => ({
      ...group,
      links: group.links.filter(link => {
        // General access filter: non-owners can only see Sales, Debt, and Stock
        if (role !== "admin" && role !== "shop_owner") {
            const allowedPaths = ["/sales", "/debt", "/stock-manager"];
            return allowedPaths.includes(link.href);
        }
        return true;
      })
    })).filter(group => group.links.length > 0);
  };

  const filteredGroups = getFilteredGroups();

  return (
    <>
      {/* Mobile Header */}
      <header className="fixed inset-x-0 top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur md:hidden">
        <div className="flex h-16 items-center justify-between px-4 gap-4">
          <Link href="/dashboard" className="flex flex-col min-w-0">
            <span className="text-sm font-black tracking-tighter text-slate-900 truncate uppercase">
              IRENE&apos;S SHOP
            </span>
            {role && (
              <span className={`mt-0.5 inline-flex w-fit items-center rounded-full border px-2 py-0.5 text-[8px] font-black uppercase tracking-widest ${currentRoleColor}`}>
                {role.replace('_', ' ')}
              </span>
            )}
          </Link>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsMobileMenuOpen((current) => !current)}
              className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 transition-all active:scale-95 shadow-sm"
              aria-expanded={isMobileMenuOpen}
            >
              {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>

        {/* Mobile Sidebar Overlay */}
        {isMobileMenuOpen && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="absolute top-16 left-0 right-0 border-t border-slate-200 bg-white p-4 max-h-[calc(100vh-4rem)] overflow-y-auto shadow-2xl"
          >
            <div className="space-y-6 pb-4">
              {filteredGroups.map((group) => (
                <div key={group.title}>
                  <SectionHeader>{group.title}</SectionHeader>
                  <div className="space-y-1">
                    {group.links.map((link) => (
                      <NavItem
                        key={link.href}
                        href={link.href}
                        icon={link.icon}
                        label={link.name}
                        active={pathname === link.href}
                        onClick={() => setIsMobileMenuOpen(false)}
                      />
                    ))}
                  </div>
                </div>
              ))}
              
              <div className="pt-4 border-t border-slate-100">
                <button
                  onClick={handleLogout}
                  className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-red-600 transition-colors font-bold text-sm bg-red-50/50"
                >
                  <LogOut size={18} />
                  <span>Log Out of Session</span>
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </header>

      {/* Desktop Sidebar */}
      <aside className="fixed left-0 top-0 z-30 hidden h-screen w-64 border-r border-slate-200 bg-white md:flex md:flex-col shadow-sm">
        <div className="border-b border-slate-100 px-6 py-8">
          <Link href="/dashboard" className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
               <div className="p-2 bg-blue-900 rounded-lg text-white">
                  <TrendingUp size={18} />
               </div>
               <span className="text-xl font-black tracking-tighter text-slate-900 uppercase">
                 IRENE&apos;S SHOP
               </span>
            </div>
            {role && (
              <span className={`inline-flex w-fit items-center rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-widest ${currentRoleColor}`}>
                {role.replace('_', ' ')}
              </span>
            )}
          </Link>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-6 scrollbar-hide">
          <nav>
            {filteredGroups.map((group) => (
              <div key={group.title} className="mb-4">
                <SectionHeader>{group.title}</SectionHeader>
                <div className="space-y-1">
                  {group.links.map((link) => (
                    <NavItem
                      key={link.href}
                      href={link.href}
                      icon={link.icon}
                      label={link.name}
                      active={pathname === link.href}
                    />
                  ))}
                </div>
              </div>
            ))}
          </nav>
        </div>

        <div className="p-4 bg-slate-50 border-t border-slate-100">
          <button
            onClick={handleLogout}
            className="group flex w-full items-center gap-3 rounded-xl px-4 py-3 text-slate-500 transition-all hover:bg-red-50 hover:text-red-600 font-bold text-sm border border-transparent hover:border-red-100"
          >
            <LogOut size={18} className="group-hover:-translate-x-1 transition-transform" />
            <span>Logout</span>
          </button>
        </div>
      </aside>
    </>
  );
}
