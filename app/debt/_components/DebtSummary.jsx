"use client";

import React from "react";

const DebtSummary = ({
  totalDebts,
  totalDebtAmount,
  totalOverdueAmount,
  totalItems,
}) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-8">
      {/* Total Debt Amount Card */}
      <div className="bg-gray-800 text-white rounded-xl shadow-md p-6">
        <p className="text-sm font-semibold opacity-80">Total Debt Amount</p>
        <h2 className="text-3xl font-extrabold mt-1">
          Ksh {totalDebtAmount.toFixed(2)}
        </h2>
        {/* Added Description */}
        <p className="text-xs mt-3 opacity-90">
          Total value of all outstanding debt.
        </p>
      </div>

      {/* Total Overdue Amount Card */}
      <div className="bg-red-500 text-white rounded-xl shadow-md p-6">
        <p className="text-sm font-semibold opacity-80">Total Overdue Amount</p>
        <h2 className="text-3xl font-extrabold mt-1">
          Ksh {totalOverdueAmount.toFixed(2)}
        </h2>
        {/* Added Description */}
        <p className="text-xs mt-3 opacity-90">
          Value of debt past its return date.
        </p>
      </div>

      {/* Total Debt Records Card */}
      <div className="bg-blue-500 text-white rounded-xl shadow-md p-6">
        <p className="text-sm font-semibold opacity-80">Total Debt Records</p>
        <h2 className="text-3xl font-extrabold mt-1">{totalDebts}</h2>
        {/* Added Description */}
        <p className="text-xs mt-3 opacity-90">
          Number of individual debt transactions.
        </p>
      </div>

      {/* Total Debt Items Card */}
      <div className="bg-indigo-500 text-white rounded-xl shadow-md p-6">
        <p className="text-sm font-semibold opacity-80">Total Debt Items</p>
        <h2 className="text-3xl font-extrabold mt-1">{totalItems}</h2>
        {/* Added Description */}
        <p className="text-xs mt-3 opacity-90">
          Total quantity of all items out on debt.
        </p>
      </div>
    </div>
  );
};

export default DebtSummary;
