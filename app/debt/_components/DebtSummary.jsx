"use client";

import React from "react";

const DebtSummary = ({
  totalDebts,
  totalDebtAmount,
  totalOverdueAmount,
  totalItems,
}) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      <div className="bg-gray-800 text-white rounded-xl shadow-md p-6">
        <p className="text-sm font-semibold opacity-80">Total Debt Amount</p>
        <h2 className="text-3xl font-extrabold mt-1">
          Ksh {totalDebtAmount.toFixed(2)}
        </h2>
      </div>
      <div className="bg-red-500 text-white rounded-xl shadow-md p-6">
        <p className="text-sm font-semibold opacity-80">Total Overdue Amount</p>
        <h2 className="text-3xl font-extrabold mt-1">
          Ksh {totalOverdueAmount.toFixed(2)}
        </h2>
      </div>
      <div className="bg-blue-500 text-white rounded-xl shadow-md p-6">
        <p className="text-sm font-semibold opacity-80">Total Debt Records</p>
        <h2 className="text-3xl font-extrabold mt-1">{totalDebts}</h2>
      </div>
      <div className="bg-indigo-500 text-white rounded-xl shadow-md p-6">
        <p className="text-sm font-semibold opacity-80">Total Debt Items</p>
        <h2 className="text-3xl font-extrabold mt-1">{totalItems}</h2>
      </div>
    </div>
  );
};

export default DebtSummary;
