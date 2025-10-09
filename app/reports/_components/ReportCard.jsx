"use client";
import React from "react";
import { TrendingUp, TrendingDown } from "lucide-react";

const ReportCard = ({
  title,
  value,
  icon,
  color,
  change,
  isCurrency = false,
}) => (
  <div className="bg-white p-6 mt-2 rounded-2xl shadow-lg border border-gray-100 transform transition-all hover:scale-105">
    <div className="flex items-start justify-between mb-4">
      <div className={`p-3 rounded-xl ${color} bg-opacity-20`}>
        {React.cloneElement(icon, { className: "h-6 w-6" })}
      </div>
      <span
        className={`text-sm font-semibold flex items-center gap-1 ${
          change > 0 ? "text-green-600" : "text-red-600"
        }`}
      >
        {change > 0 ? (
          <TrendingUp className="w-4 h-4" />
        ) : (
          <TrendingDown className="w-4 h-4" />
        )}
        {Math.abs(change)}%
      </span>
    </div>
    <h3 className="text-sm font-bold text-gray-700 mb-1">{title}</h3>
    <p className="text-3xl font-semibold text-gray-900 truncate">
      {isCurrency ? `KSh${value.toLocaleString()}` : value.toLocaleString()}
    </p>
  </div>
);

export default ReportCard;
