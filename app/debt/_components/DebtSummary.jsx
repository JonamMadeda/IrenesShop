"use client";

import React from "react";
import { 
  Wallet, 
  AlertTriangle, 
  ClipboardList, 
  ShoppingBag,
  ArrowUpRight
} from "lucide-react";

const MetricCard = ({ icon: Icon, label, value, subtext, tone = "blue" }) => {
  const tones = {
    blue: "bg-blue-50 text-blue-700 border-blue-100",
    red: "bg-red-50 text-red-700 border-red-100",
    emerald: "bg-emerald-50 text-emerald-700 border-emerald-100",
    indigo: "bg-indigo-50 text-indigo-700 border-indigo-100",
  };

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition-all hover:shadow-md">
      <div className="flex justify-between items-start">
        <div className={`inline-flex rounded-xl border p-3 ${tones[tone]}`}>
          <Icon size={20} />
        </div>
      </div>
      <p className="mt-4 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">
        {label}
      </p>
      <div className="mt-1 flex items-baseline gap-2">
        <h2 className="text-2xl font-bold text-slate-900">{value}</h2>
      </div>
      <p className="mt-1 text-xs text-slate-500 font-medium">{subtext}</p>
    </div>
  );
};

const DebtSummary = ({
  totalDebts,
  totalDebtAmount,
  totalOverdueAmount,
  totalItems,
}) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      <MetricCard
        icon={Wallet}
        label="Total Credit Value"
        value={`KSh ${totalDebtAmount.toLocaleString()}`}
        subtext="Total outstanding amount"
        tone="blue"
      />
      
      <MetricCard
        icon={AlertTriangle}
        label="Overdue Credits"
        value={`KSh ${totalOverdueAmount.toLocaleString()}`}
        subtext="Past return deadline"
        tone="red"
      />

      <MetricCard
        icon={ClipboardList}
        label="Active Records"
        value={totalDebts}
        subtext="Total unique transactions"
        tone="indigo"
      />

      <MetricCard
        icon={ShoppingBag}
        label="Total Items"
        value={totalItems}
        subtext="Units out on credit"
        tone="emerald"
      />
    </div>
  );
};

export default DebtSummary;
