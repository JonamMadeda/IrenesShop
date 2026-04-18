"use client";

import React, { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ShoppingCart,
  Package,
  AlertTriangle,
  BarChart,
  TrendingUp,
  Activity,
  ArrowUpRight,
  ArrowDownRight,
  PlusCircle,
  FileText,
  Users,
  Box,
  Wallet,
  Clock,
  ChevronRight,
} from "lucide-react";

import { format } from "date-fns";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from "chart.js";
import { Line, Doughnut } from "react-chartjs-2";

import { createClient } from "@/utils/supabase/client";
import { getShopContext } from "@/utils/supabase/getShopContext";
import PageLoader from "@/app/components/PageLoader";

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

// ---------- Helper Components ----------

const MetricCard = ({ icon: Icon, label, value, subtext, trend, tone = "blue" }) => {
  const tones = {
    blue: "bg-blue-50 text-blue-700 border-blue-100",
    emerald: "bg-emerald-50 text-emerald-700 border-emerald-100",
    amber: "bg-amber-50 text-amber-700 border-amber-100",
    slate: "bg-slate-50 text-slate-700 border-slate-100",
    indigo: "bg-indigo-50 text-indigo-700 border-indigo-100",
  };

  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition-all hover:shadow-md">
      <div className="flex justify-between items-start">
        <div className={`inline-flex rounded-2xl border p-3 ${tones[tone]}`}>
          <Icon size={22} />
        </div>
        {trend && (
          <div className={`flex items-center text-xs font-bold ${trend > 0 ? "text-emerald-600" : "text-amber-600"}`}>
            {trend > 0 ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
            {Math.abs(trend)}%
          </div>
        )}
      </div>
      <p className="mt-4 text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
        {label}
      </p>
      <div className="mt-2 flex items-baseline gap-2">
        <p className="text-3xl font-bold text-slate-900">{value}</p>
        {subtext && <span className="text-sm text-slate-500 font-medium">{subtext}</span>}
      </div>
    </div>
  );
};

const QuickAction = ({ icon: Icon, label, href, tone = "blue" }) => {
  const tones = {
    blue: "hover:bg-blue-50 text-blue-700 border-blue-100 bg-white",
    slate: "hover:bg-slate-50 text-slate-700 border-slate-100 bg-white",
    blue_solid: "bg-blue-700 text-white hover:bg-blue-800 border-transparent shadow-lg shadow-blue-200",
  };

  return (
    <a
      href={href}
      className={`flex flex-col items-center justify-center gap-3 p-5 rounded-3xl border transition-all hover:scale-[1.02] active:scale-95 group ${tones[tone]}`}
    >
      <Icon size={24} className="group-hover:scale-110 transition-transform" />
      <span className="text-xs font-bold uppercase tracking-wider">{label}</span>
      <ChevronRight size={14} className="opacity-0 group-hover:opacity-100 transition-opacity" />
    </a>
  );
};

// ---------- Main Dashboard Component ----------

export default function Dashboard() {
  const supabase = createClient();
  const [user, setUser] = useState(null);
  const [displayName, setDisplayName] = useState("Management");
  const [loading, setLoading] = useState(true);
  const [shopId, setShopId] = useState(null);
  
  // Dashboard Data State
  const [stats, setStats] = useState({
    todayRevenue: 0,
    todaySalesCount: 0,
    monthlyProfit: 0,
    activeSkus: 0,
    lowStockCount: 0,
    outOfStockCount: 0,
  });
  
  const [revenueTrend, setRevenueTrend] = useState({
    labels: [],
    datasets: [],
  });
  
  const [recentLogs, setRecentLogs] = useState([]);
  const [criticalItems, setCriticalItems] = useState([]);

  // Fetch Logic
  const fetchDashboardData = async (queryId) => {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);

      // 1. Fetch Today's Sales
      const { data: todaySales } = await supabase
        .from("sales")
        .select("total_revenue, profit")
        .eq("user_id", queryId)
        .gte("sale_date", today.toISOString());

      // 2. Fetch Monthly Stats
      const { data: monthSales } = await supabase
        .from("sales")
        .select("profit")
        .eq("user_id", queryId)
        .gte("sale_date", startOfMonth.toISOString());

      // 3. Fetch Stock Stats
      const { data: items } = await supabase
        .from("items")
        .select("id, name, quantity")
        .eq("user_id", queryId);

      // 4. Fetch Revenue Trend (Last 14 days)
      const twoWeeksAgo = new Date();
      twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);
      
      const { data: trendData } = await supabase
        .from("sales")
        .select("sale_date, total_revenue")
        .eq("user_id", queryId)
        .gte("sale_date", twoWeeksAgo.toISOString())
        .order("sale_date", { ascending: true });

      // 5. Fetch Recent Logs
      const { data: logs } = await supabase
        .from("system_logs")
        .select("*")
        .eq("shop_id", queryId)
        .order("created_at", { ascending: false })
        .limit(6);

      // Process Stats
      const statsObj = {
        todayRevenue: todaySales?.reduce((sum, s) => sum + (s.total_revenue || 0), 0) || 0,
        todaySalesCount: todaySales?.length || 0,
        monthlyProfit: monthSales?.reduce((sum, s) => sum + (s.profit || 0), 0) || 0,
        activeSkus: items?.length || 0,
        lowStockCount: items?.filter(i => i.quantity > 0 && i.quantity <= 5).length || 0,
        outOfStockCount: items?.filter(i => i.quantity <= 0).length || 0,
      };
      
      setStats(statsObj);
      setRecentLogs(logs || []);
      setCriticalItems(items?.filter(i => i.quantity <= 5).sort((a,b) => a.quantity - b.quantity).slice(0, 5) || []);

      // Process Trend Line Chart
      const dailyMap = {};
      for (let i = 13; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        dailyMap[d.toISOString().split("T")[0]] = 0;
      }

      trendData?.forEach(s => {
        const date = new Date(s.sale_date).toISOString().split("T")[0];
        if (dailyMap[date] !== undefined) {
          dailyMap[date] += (s.total_revenue || 0);
        }
      });

      setRevenueTrend({
        labels: Object.keys(dailyMap).map(d => format(new Date(d), "MMM d")),
        datasets: [{
          label: "Daily Revenue",
          data: Object.values(dailyMap),
          fill: true,
          borderColor: "#2563eb",
          backgroundColor: "rgba(37, 99, 235, 0.05)",
          tension: 0.4,
          pointRadius: 4,
          pointHoverRadius: 6,
        }]
      });

    } catch (err) {
      console.error("Dashboard data fetch error:", err);
    }
  };

  useEffect(() => {
    const initDashboard = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        window.location.href = "/auth";
        return;
      }
      setUser(user);
      setDisplayName(user.user_metadata?.display_name || user.email?.split("@")[0] || "Management");
      
      const { queryId } = await getShopContext(user.id);
      setShopId(queryId);
      
      await fetchDashboardData(queryId);
      setLoading(false);

      // Subscriptions
      const itemsChannel = supabase.channel('dashboard_updates')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'items', filter: `user_id=eq.${queryId}` }, () => fetchDashboardData(queryId))
        .on('postgres_changes', { event: '*', schema: 'public', table: 'sales', filter: `user_id=eq.${queryId}` }, () => fetchDashboardData(queryId))
        .on('postgres_changes', { event: '*', schema: 'public', table: 'system_logs', filter: `shop_id=eq.${queryId}` }, () => fetchDashboardData(queryId))
        .subscribe();
        
      return () => supabase.removeChannel(itemsChannel);
    };

    initDashboard();
  }, []);

  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good Morning";
    if (hour < 18) return "Good Afternoon";
    return "Good Evening";
  }, []);

  if (loading) return <PageLoader />;

  return (
    <div className="min-h-screen bg-slate-50 p-6 md:p-10 font-sans">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mx-auto max-w-7xl space-y-8"
      >
        {/* Header Section */}
        <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-blue-600">
              System Dashboard
            </p>
            <h1 className="mt-3 text-4xl font-bold tracking-tight text-slate-900">
              {greeting}, {displayName}
            </h1>
            <p className="mt-3 text-sm leading-6 text-slate-500 max-w-xl">
              Welcome back to Irene&apos;s Shop management portal. Here is a summary of your operations for {new Date().toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })}.
            </p>
          </div>
          <div className="flex gap-3">
             <div className="flex items-center gap-2 rounded-full border border-emerald-100 bg-emerald-50 px-4 py-2 text-xs font-bold uppercase tracking-wider text-emerald-700">
                <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-500"></span>
                System Operational
             </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <MetricCard
            icon={TrendingUp}
            label="Today's Revenue"
            value={`KSh ${stats.todayRevenue.toLocaleString()}`}
            subtext={`${stats.todaySalesCount} sales`}
            tone="blue"
          />
          <MetricCard
            icon={Wallet}
            label="Monthly Profit"
            value={`KSh ${stats.monthlyProfit.toLocaleString()}`}
            tone="emerald"
          />
          <MetricCard
            icon={AlertTriangle}
            label="Deficit / Low Stock"
            value={`${stats.lowStockCount + stats.outOfStockCount}`}
            subtext={`${stats.outOfStockCount} out of stock`}
            tone={stats.outOfStockCount > 0 ? "amber" : "slate"}
          />
          <MetricCard
             icon={Box}
             label="Active Products"
             value={stats.activeSkus}
             subtext="Total unique SKUs"
             tone="indigo"
          />
        </div>

        {/* Visualization & Quick Actions */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            {/* Chart Panel */}
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
              <div className="mb-6 flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-bold text-slate-900">Revenue Performance</h3>
                  <p className="text-xs text-slate-500 font-medium uppercase tracking-wider mt-1">14-Day Growth Trend</p>
                </div>
                <div className="flex items-center gap-4">
                   <div className="flex items-center gap-2">
                     <div className="h-1 w-4 rounded-full bg-blue-600"></div>
                     <span className="text-xs font-bold text-slate-600 uppercase tracking-tighter">Daily Total</span>
                   </div>
                </div>
              </div>
              <div className="h-[300px] w-full">
                {revenueTrend.labels.length > 0 && (
                  <Line
                    data={revenueTrend}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      plugins: { legend: { display: false } },
                      scales: {
                        y: { beginAtZero: true, grid: { color: "rgba(0,0,0,0.03)" }, ticks: { font: { size: 10 } } },
                        x: { grid: { display: false }, ticks: { font: { size: 10 } } },
                      },
                    }}
                  />
                )}
              </div>
            </div>

            {/* Recent Activity */}
            <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
               <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
                  <div className="flex items-center gap-3 text-slate-900 font-bold">
                     <Activity size={18} className="text-blue-600" />
                     <h3>Recent Activity</h3>
                  </div>
                  <a href="/logs" className="text-xs font-bold uppercase tracking-wider text-blue-600 hover:underline">View All</a>
               </div>
               <div className="divide-y divide-slate-100">
                  {recentLogs.length > 0 ? recentLogs.map((log) => (
                    <div key={log.id} className="p-4 flex items-center gap-4 hover:bg-slate-50 transition-colors">
                       <div className={`p-2 rounded-xl border ${log.action === 'delete' ? 'border-amber-100 bg-amber-50 text-amber-600' : 'border-indigo-100 bg-indigo-50 text-indigo-600'}`}>
                          <Clock size={16} />
                       </div>
                       <div className="flex-1">
                          <p className="text-sm font-semibold text-slate-900">
                            {log.actor_name} {log.action}d <span className="text-slate-500 font-normal">{log.entity_name}</span>
                          </p>
                          <p className="text-xs text-slate-400 mt-0.5">{new Date(log.created_at).toLocaleString()}</p>
                       </div>
                       <div className="text-[10px] font-bold uppercase tracking-widest text-slate-400 px-3 py-1 bg-slate-100 rounded-full">
                          {log.entity_type}
                       </div>
                    </div>
                  )) : (
                    <div className="p-10 text-center text-slate-400 text-sm italic">No recent activity detected.</div>
                  )}
               </div>
            </div>
          </div>

          <div className="space-y-8">
            {/* Quick Actions Panel */}
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm font-sans">
              <h3 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2">
                <BarChart size={18} className="text-blue-600" /> Quick Actions
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <QuickAction icon={PlusCircle} label="Record Sale" href="/sales" tone="blue_solid" />
                <QuickAction icon={Box} label="Add Stock" href="/stock-manager" tone="blue" />
                <QuickAction icon={FileText} label="Reports" href="/reports" tone="slate" />
                <QuickAction icon={Wallet} label="Debt Ledger" href="/debt" tone="slate" />
                <QuickAction icon={Users} label="Attendants" href="/attendants" tone="slate" />
                <QuickAction icon={Activity} label="System Logs" href="/logs" tone="slate" />
              </div>
            </div>

            {/* Inventory Watch */}
            <div className="bg-indigo-900 p-6 rounded-3xl shadow-xl shadow-indigo-100 text-white relative overflow-hidden">
               {/* Pattern overlay */}
               <div className="absolute top-0 right-0 p-8 opacity-10">
                  <Package size={120} />
               </div>
               
               <h3 className="text-lg font-bold flex items-center gap-2 relative z-10">
                 <AlertTriangle size={18} className="text-amber-400" /> Stock Watch
               </h3>
               <p className="mt-2 text-indigo-200 text-xs font-medium uppercase tracking-wider relative z-10">Critical Priority Items</p>
               
               <div className="mt-6 space-y-3 relative z-10">
                  {criticalItems.length > 0 ? criticalItems.map(item => (
                    <div key={item.id} className="flex items-center justify-between p-3 rounded-2xl bg-white/10 hover:bg-white/15 transition-colors border border-white/10">
                       <span className="text-sm font-semibold truncate max-w-[150px]">{item.name}</span>
                       <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest ${item.quantity <= 0 ? 'bg-red-500/20 text-red-200 border border-red-500/30' : 'bg-amber-500/20 text-amber-200 border border-amber-500/30'}`}>
                          {item.quantity} Left
                       </span>
                    </div>
                  )) : (
                    <div className="p-4 text-center text-indigo-300 text-sm italic">Inventory health is clear.</div>
                  )}
               </div>
               
               <a href="/stock-manager" className="mt-8 block w-full text-center py-4 bg-white/10 border border-white/20 rounded-2xl text-sm font-bold uppercase tracking-widest hover:bg-white/20 transition-all">
                  Manage Inventory
               </a>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

