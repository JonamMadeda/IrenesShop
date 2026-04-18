"use client";

import { useEffect, useMemo, useState } from "react";
import { ClipboardList, Loader2, Search, ShieldCheck } from "lucide-react";

import PageLoader from "@/app/components/PageLoader";
import { useShop } from "@/app/context/ShopContext";
import { createClient } from "@/utils/supabase/client";

const actionLabels = {
  create: "Created",
  update: "Updated",
  delete: "Deleted",
  mark_paid: "Marked Paid",
  mark_unpaid: "Marked Unpaid",
  convert_to_sale: "Converted To Sale",
  stock_adjustment: "Stock Adjustment",
};

const Card = ({ children, className = "" }) => (
  <div className={`overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm ${className}`}>
    {children}
  </div>
);

export default function LogsPage() {
  const supabase = createClient();
  const { user, role, queryId, loading } = useShop();
  const [logs, setLogs] = useState([]);
  const [isFetching, setIsFetching] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");

  const canViewLogs = role === "shop_owner" || role === "admin";

  useEffect(() => {
    if (!queryId || !canViewLogs) {
      setIsFetching(false);
      return;
    }

    const fetchLogs = async () => {
      setIsFetching(true);
      const { data, error: fetchError } = await supabase
        .from("system_logs")
        .select("*")
        .eq("shop_id", queryId)
        .order("created_at", { ascending: false })
        .limit(200);

      if (fetchError) {
        console.error("Failed to fetch system logs:", fetchError);
        setError("We could not load the system logs right now.");
      } else {
        setLogs(data || []);
        setError(null);
      }

      setIsFetching(false);
    };

    fetchLogs();

    const channel = supabase
      .channel("system_logs_changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "system_logs", filter: `shop_id=eq.${queryId}` },
        () => fetchLogs()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [canViewLogs, queryId, supabase]);

  const filteredLogs = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase();

    if (!normalizedQuery) {
      return logs;
    }

    return logs.filter((log) => {
      const haystack = [
        log.actor_name,
        log.actor_email,
        log.actor_role,
        log.action,
        log.entity_type,
        log.entity_name,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return haystack.includes(normalizedQuery);
    });
  }, [logs, searchQuery]);

  if (loading || !user) {
    return <PageLoader />;
  }

  if (!canViewLogs) {
    return (
      <div className="min-h-screen bg-slate-50 p-4 pt-20 md:p-8 md:pt-8">
        <div className="mx-auto max-w-3xl">
          <Card className="p-8 md:p-10">
            <div className="flex items-start gap-4">
              <ShieldCheck className="mt-1 h-8 w-8 text-blue-600" />
              <div>
                <h1 className="text-2xl font-bold text-slate-900">Logs page is restricted</h1>
                <p className="mt-3 text-sm leading-6 text-slate-600">
                  This page is available only to the shop owner account so that system activity can be reviewed centrally.
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
      <div className="mx-auto max-w-7xl space-y-8">
        <Card className="p-6 md:p-8">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl">
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-blue-600">
                Shop Owner Workspace
              </p>
              <h1 className="mt-3 text-3xl font-bold tracking-tight text-slate-900">
                System Logs
              </h1>
              <p className="mt-3 text-sm leading-6 text-slate-600">
                Review recent system activity across stock, sales, debts, attendants, and other operational changes made inside Irene&apos;s Shop.
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-5">
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input
              type="text"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Search by actor, action, role, or record type..."
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-3 pl-11 pr-4 text-sm font-medium text-slate-900 outline-none transition-all focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
            />
          </div>
        </Card>

        <Card>
          <div className="border-b border-slate-200 px-6 py-5">
            <div className="flex items-center gap-3">
              <ClipboardList className="h-5 w-5 text-blue-600" />
              <div>
                <h2 className="text-lg font-bold text-slate-900">Recent activity</h2>
                <p className="text-sm text-slate-500">Latest recorded changes across the shop system.</p>
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
                  <th className="px-6 py-4 text-xs font-bold uppercase tracking-widest text-slate-400">When</th>
                  <th className="px-6 py-4 text-xs font-bold uppercase tracking-widest text-slate-400">Actor</th>
                  <th className="px-6 py-4 text-xs font-bold uppercase tracking-widest text-slate-400">Action</th>
                  <th className="px-6 py-4 text-xs font-bold uppercase tracking-widest text-slate-400">Record</th>
                  <th className="px-6 py-4 text-xs font-bold uppercase tracking-widest text-slate-400">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {isFetching ? (
                  <tr>
                    <td colSpan="5" className="px-6 py-12 text-center text-slate-400">
                      <Loader2 className="mx-auto mb-2 h-6 w-6 animate-spin" />
                      Loading logs...
                    </td>
                  </tr>
                ) : filteredLogs.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="px-6 py-12 text-center text-slate-400">
                      No logs found yet.
                    </td>
                  </tr>
                ) : (
                  filteredLogs.map((log) => (
                    <tr key={log.id} className="align-top hover:bg-slate-50/70">
                      <td className="px-6 py-4 text-sm text-slate-500">
                        {log.created_at ? new Date(log.created_at).toLocaleString() : "Not available"}
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-sm font-semibold text-slate-900">{log.actor_name || "Unknown user"}</p>
                        <p className="text-xs text-slate-500">{log.actor_email || "No email"}</p>
                        <p className="mt-2 text-xs font-semibold uppercase tracking-wider text-blue-700">
                          {String(log.actor_role || "staff").replaceAll("_", " ")}
                        </p>
                      </td>
                      <td className="px-6 py-4 text-sm font-semibold text-slate-800">
                        {actionLabels[log.action] || log.action}
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-sm font-semibold text-slate-900">{log.entity_name || "Unnamed record"}</p>
                        <p className="text-xs uppercase tracking-wider text-slate-500">
                          {String(log.entity_type || "record").replaceAll("_", " ")}
                        </p>
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-500 max-w-xs">
                        {log.details ? (
                          <div className="flex flex-col gap-1.5">
                            {Object.entries(log.details).map(([key, value]) => {
                              const label = key.replaceAll("_", " ");
                              let displayValue = value;

                              // Handle Currency Formatting
                              if (["profit", "total_revenue", "total_cost", "total_amount"].includes(key)) {
                                displayValue = `KSh ${Number(value || 0).toLocaleString()}`;
                              }

                              // Handle Date Formatting
                              if (key.includes("date") && typeof value === 'string') {
                                try {
                                  displayValue = new Date(value).toLocaleDateString();
                                } catch (e) {}
                              }

                              return (
                                <div key={key} className="flex justify-between items-start gap-3 border-b border-slate-50 pb-1 last:border-0 last:pb-0">
                                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 shrink-0 mt-0.5">
                                    {label}:
                                  </span>
                                  <span className="text-xs font-semibold text-slate-700 break-words text-right">
                                    {String(displayValue)}
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                        ) : (
                          <span className="text-xs italic text-slate-400">No extra details</span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </div>
  );
}
