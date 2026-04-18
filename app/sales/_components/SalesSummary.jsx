import React from "react";
import { DollarSign, Package, ShoppingCart, TrendingUp } from "lucide-react";

const formatCurrency = (value) => {
  const numericValue = Number(value ?? 0);
  if (Number.isNaN(numericValue)) return "KSh 0";
  return `KSh ${numericValue.toLocaleString()}`;
};

const MetricCard = ({ icon: Icon, label, value, tone = "blue" }) => {
  const tones = {
    blue: "bg-blue-50 text-blue-700 border-blue-100",
    emerald: "bg-emerald-50 text-emerald-700 border-emerald-100",
    amber: "bg-amber-50 text-amber-700 border-amber-100",
    slate: "bg-slate-50 text-slate-700 border-slate-100",
  };

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className={`inline-flex rounded-xl border p-3 ${tones[tone]}`}>
        <Icon size={18} />
      </div>
      <p className="mt-4 text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
        {label}
      </p>
      <p className="mt-2 text-2xl font-bold text-slate-900">{value}</p>
    </div>
  );
};

const SalesSummary = ({
  totalSalesRecords,
  totalRevenue,
  totalProfit,
  totalItemsSold,
}) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
      <MetricCard
        icon={Package}
        label="Total Sales Records"
        value={totalSalesRecords}
        tone="blue"
      />
      <MetricCard
        icon={ShoppingCart}
        label="Total Items Sold"
        value={totalItemsSold}
        tone="emerald"
      />
      <MetricCard
        icon={DollarSign}
        label="Total Revenue"
        value={formatCurrency(totalRevenue)}
        tone="slate"
      />
      <MetricCard
        icon={TrendingUp}
        label="Total Profit"
        value={formatCurrency(totalProfit)}
        tone={totalProfit >= 0 ? "emerald" : "amber"}
      />
    </div>
  );
};

export default SalesSummary;

