// ./_components/DebtMetrics.jsx

import React from "react";
import {
  DollarSign,
  ShoppingCart,
  Package,
  BarChart2,
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
} from "lucide-react";
import { format, isValid } from "date-fns";

// Metric Card Component
const MetricCard = ({ title, value, icon, color, isCurrency = false }) => (
  <div className="bg-white p-4 sm:p-6 rounded-2xl shadow-lg border border-gray-100 flex flex-col justify-between h-full">
    <div className="flex items-start justify-between mb-2">
      <div className={`p-3 rounded-xl ${color} bg-opacity-20 text-white`}>
        {/* We use color for both text and background opacity for a modern look */}
        {React.cloneElement(icon, { className: "h-6 w-6" })}
      </div>
    </div>
    <h3 className="text-sm font-medium text-gray-500 mb-1">{title}</h3>
    <p className="text-xl sm:text-3xl font-bold text-gray-900 truncate">
      {isCurrency
        ? `KSh${value.toLocaleString(undefined, {
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
          })}`
        : value.toLocaleString()}
    </p>
  </div>
);

// Main Debt Metrics and Navigation Component
const DebtMetrics = ({
  debts,
  period,
  currentDate,
  navigateDate,
  handlePeriodChange,
  handleDateSelect,
  dateRange,
  // New prop added for the "Record New Debt" button functionality
  openPopup,
}) => {
  // Filter debts for the current period and calculate metrics
  const { start, end } = dateRange;
  const filteredDebts = debts.filter((debt) => {
    const debtDate = new Date(debt.dateTaken);
    return debtDate >= start && debtDate <= end;
  });

  const totalDebtRecords = filteredDebts.length;
  const totalAmountOwed = filteredDebts
    .filter((d) => !d.isPaid)
    .reduce((sum, debt) => sum + (debt.totalAmount || 0), 0);
  const totalItemsLent = filteredDebts.reduce(
    (sum, debt) => sum + (debt.itemQuantity || 0),
    0
  );
  const totalOverdue = filteredDebts.filter(
    (debt) => !debt.isPaid && new Date(debt.returnDate) < new Date()
  ).length;

  // Format date range for display (simplified for debt tracker focus)
  const formatDateRange = () => {
    if (!isValid(start) || !isValid(end)) return "Invalid Range";
    if (period === "daily") return format(start, "EEEE, MMMM dd, yyyy");
    if (period === "monthly") return format(start, "MMMM yyyy");
    if (period === "yearly") return format(start, "yyyy");
    return `${format(start, "MMM dd")} - ${format(end, "MMM dd, yyyy")}`;
  };

  return (
    <div className="space-y-6">
      {/* Header and New Record Button */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
        <h1 className="text-2xl sm:text-4xl font-bold text-gray-900 tracking-tight">
          Debt Tracker
        </h1>
        <button
          onClick={() => openPopup()}
          className="px-6 py-3 rounded-xl font-bold text-sm text-white transition-all duration-300 transform bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-4 focus:ring-blue-300 active:scale-95 shadow-lg"
        >
          Record New Debt
        </button>
      </div>

      {/* Period Selector & Date Navigation */}
      <div className="bg-white p-4 rounded-xl shadow-md border border-gray-100 flex flex-col sm:flex-row items-start sm:items-center justify-between relative z-40">
        <div className="flex items-center space-x-2 mb-4 sm:mb-0">
          <button
            onClick={() => navigateDate("prev")}
            className="p-2 rounded-full hover:bg-gray-100 transition-colors text-gray-600"
            aria-label="Previous period"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button
            onClick={() => navigateDate("next")}
            className="p-2 rounded-full hover:bg-gray-100 transition-colors text-gray-600"
            aria-label="Next period"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
          <div className="relative">
            <input
              type="date"
              value={format(currentDate, "yyyy-MM-dd")}
              onChange={handleDateSelect}
              className="block appearance-none w-full bg-gray-50 border border-gray-300 text-gray-800 py-2 px-4 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 pr-10 text-sm md:text-base"
            />
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
              <CalendarIcon className="h-5 w-5" />
            </div>
          </div>
          <p className="text-sm font-semibold text-gray-600 ml-4 hidden sm:block">
            {formatDateRange()}
          </p>
        </div>
        <div className="flex items-center space-x-2">
          {["daily", "weekly", "monthly", "yearly"].map((p) => (
            <button
              key={p}
              onClick={() => handlePeriodChange(p)}
              className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
                period === p
                  ? "bg-blue-600 text-white shadow-md"
                  : "text-gray-600 bg-gray-50 hover:bg-gray-100"
              }`}
            >
              {p.charAt(0).toUpperCase() + p.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Report Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Total Debt Records"
          value={totalDebtRecords}
          icon={<BarChart2 />}
          color="text-blue-600 bg-blue-600"
          isCurrency={false}
        />
        <MetricCard
          title="Total Amount Owed"
          value={totalAmountOwed}
          icon={<DollarSign />}
          color="text-red-600 bg-red-600"
          isCurrency={true}
        />
        <MetricCard
          title="Items Lent Out"
          value={totalItemsLent}
          icon={<Package />}
          color="text-purple-600 bg-purple-600"
          isCurrency={false}
        />
        <MetricCard
          title="Records Overdue"
          value={totalOverdue}
          icon={<ShoppingCart />}
          color="text-orange-600 bg-orange-600"
          isCurrency={false}
        />
      </div>
    </div>
  );
};

export default DebtMetrics;
