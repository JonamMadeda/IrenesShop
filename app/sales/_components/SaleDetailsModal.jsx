"use client";

import { format } from "date-fns";
import { Info, Mail, Package2, ShoppingCart, User, X } from "lucide-react";

const formatCurrency = (value) => {
  const numericValue = Number(value ?? 0);
  if (Number.isNaN(numericValue)) {
    return "KSh 0";
  }

  return `KSh ${numericValue.toLocaleString()}`;
};

const DetailRow = ({ label, value }) => (
  <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">{label}</p>
    <p className="mt-2 text-sm font-semibold text-slate-900">{value || "Not available"}</p>
  </div>
);

export default function SaleDetailsModal({ sale, onClose }) {
  if (!sale) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm">
      <div className="w-full max-w-3xl rounded-3xl bg-white shadow-2xl">
        <div className="flex items-start justify-between border-b border-slate-200 px-6 py-5">
          <div>
            <div className="flex items-center gap-2 text-blue-600">
              <Info className="h-5 w-5" />
              <p className="text-sm font-semibold uppercase tracking-[0.18em]">Sale Details</p>
            </div>
            <h3 className="mt-3 text-2xl font-bold text-slate-900">{sale.itemName}</h3>
            <p className="mt-1 text-sm text-slate-500">
              {sale.saleDate ? format(new Date(sale.saleDate), "MMMM d, yyyy 'at' h:mm a") : "Date not available"}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-xl p-2 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
            aria-label="Close sale details"
          >
            <X size={20} />
          </button>
        </div>

        <div className="grid gap-6 px-6 py-6 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <DetailRow label="Quantity Sold" value={sale.quantity} />
              <DetailRow label="Items Remaining" value={sale.remainingQuantity ?? "Not recorded"} />
              <DetailRow label="Revenue" value={formatCurrency(sale.totalRevenue)} />
              <DetailRow label="Cost" value={formatCurrency(sale.totalCost)} />
              <DetailRow label="Profit" value={formatCurrency((Number(sale.totalRevenue ?? 0) - Number(sale.totalCost ?? 0)) || sale.profit)} />
              <DetailRow label="Category" value={sale.itemCategory || "Uncategorized"} />
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-5">
              <p className="text-sm font-semibold text-slate-900">Record Summary</p>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <div className="flex items-center gap-3 rounded-xl bg-slate-50 p-4">
                  <ShoppingCart className="h-5 w-5 text-blue-600" />
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Item ID</p>
                    <p className="mt-1 text-sm font-semibold text-slate-900">{sale.itemId || "Not available"}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 rounded-xl bg-slate-50 p-4">
                  <Package2 className="h-5 w-5 text-blue-600" />
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Record ID</p>
                    <p className="mt-1 text-sm font-semibold text-slate-900">{sale.id || "Not available"}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
              <p className="text-sm font-semibold text-slate-900">Recorded By</p>
              <div className="mt-4 space-y-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-100 text-blue-700">
                    <User className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-900">
                      {sale.recordedByName || "Not available"}
                    </p>
                    <p className="text-xs text-slate-500">
                      User ID: {sale.recordedByUserId || "Not available"}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 rounded-xl bg-white p-4">
                  <Mail className="h-5 w-5 text-blue-600" />
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Email</p>
                    <p className="mt-1 text-sm font-semibold text-slate-900">
                      {sale.recordedByEmail || "Not available"}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 rounded-xl bg-white p-4">
                  <User className="h-5 w-5 text-blue-600" />
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Role</p>
                    <p className="mt-1 text-sm font-semibold text-slate-900">
                      {sale.recordedByRole
                        ? String(sale.recordedByRole).replaceAll("_", " ")
                        : "Not available"}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-blue-100 bg-blue-50 p-5">
              <p className="text-sm font-semibold text-blue-900">Operational Note</p>
              <p className="mt-2 text-sm leading-6 text-blue-900/75">
                This view captures the main audit details for the selected sale, including the actor, sold quantity, remaining stock at the time of recording, and the commercial values attached to the transaction.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
