import React from "react";
import { format } from "date-fns";

// Helper function to safely extract a numeric value
const getNumericValue = (value) => {
  const parsedValue = parseFloat(value);
  return isNaN(parsedValue) ? 0 : parsedValue;
};

const SalesTable = ({ sales, loading, error, onEdit, onDeleteClick, onViewDetails }) => {
  if (loading) {
    return <div className="text-center py-10 text-sm text-slate-500 font-medium">Loading sales records...</div>;
  }
  if (error) {
    return <div className="text-center py-10 text-sm text-red-600 font-medium">{error}</div>;
  }
  if (sales.length === 0) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center text-sm text-slate-500 shadow-lg">
        No sales records found for this period.
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-lg">
      <div className="mb-6 flex flex-col gap-2">
        <h2 className="text-2xl font-bold text-slate-900">Transaction History</h2>
        <p className="text-sm text-slate-500">
          Review and manage individual sale records for the selected period.
        </p>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-200">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                Date
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                Item
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                Qty
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                Remaining
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                Revenue
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                Profit
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 bg-white">
            {sales.map((sale) => (
              <tr key={sale.id} className="hover:bg-slate-50/80">
                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
                  {sale.saleDate
                    ? format(new Date(sale.saleDate), "MMM d, yyyy")
                    : "N/A"}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <p className="text-sm font-semibold text-slate-900">{sale.itemName}</p>
                  <p className="text-xs text-slate-500">{sale.itemCategory}</p>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
                  {sale.quantity}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 font-medium">
                  {sale.remainingQuantity ?? "N/A"}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600 font-semibold">
                  KSh {getNumericValue(sale.totalRevenue).toLocaleString()}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-emerald-700">
                  KSh{" "}
                  {(
                    getNumericValue(sale.totalRevenue) -
                    getNumericValue(sale.totalCost)
                  ).toLocaleString()}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => onViewDetails(sale)}
                      className="text-slate-600 transition-colors hover:text-slate-900"
                    >
                      View
                    </button>
                    <button
                      onClick={() => onEdit(sale)}
                      className="text-blue-600 transition-colors hover:text-blue-900"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => onDeleteClick(sale.id)}
                      className="text-red-600 transition-colors hover:text-red-900"
                    >
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default SalesTable;
