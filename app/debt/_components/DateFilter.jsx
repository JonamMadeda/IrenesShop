"use client";

import React from "react";
import { Calendar, ChevronDown } from "lucide-react";

/**
 * Modernized DateFilter component that matches the professional workspace aesthetic.
 */
const DateFilter = ({
  selectedDate,
  setSelectedDate,
  activeRange,
  setActiveRange,
}) => {
  const ranges = ["Daily", "Weekly", "Monthly", "Yearly"];

  return (
    <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm mb-8 flex flex-col md:flex-row items-center justify-between gap-6">
      {/* Date Input Section */}
      <div className="flex items-center gap-4 w-full md:w-auto">
        <div className="flex items-center justify-center p-2.5 bg-blue-50 text-blue-600 rounded-xl border border-blue-100">
          <Calendar size={18} />
        </div>
        <div className="relative flex-1 md:flex-none">
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="w-full md:w-48 appearance-none bg-slate-50 border border-slate-200 text-slate-900 py-2.5 px-4 rounded-xl text-sm font-bold focus:outline-none focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition-all cursor-pointer"
          />
          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={14} />
        </div>
        <span className="hidden lg:block text-xs font-bold uppercase tracking-widest text-slate-400">
           Filter Baseline
        </span>
      </div>

      {/* Range Selection Section */}
      <div className="flex items-center gap-1.5 p-1.5 bg-slate-50 border border-slate-200 rounded-2xl w-full md:w-auto overflow-x-auto scrollbar-hide">
        {ranges.map((range) => (
          <button
            key={range}
            onClick={() => setActiveRange(range)}
            className={`flex-1 md:flex-none px-6 py-2 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all ${
              activeRange === range
                ? "bg-blue-700 text-white shadow-lg shadow-blue-100"
                : "text-slate-400 hover:text-slate-600 hover:bg-white"
            }`}
          >
            {range}
          </button>
        ))}
      </div>
    </div>
  );
};

export default DateFilter;
