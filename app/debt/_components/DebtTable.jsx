"use client";

import React, { useState } from "react";
import ConfirmationModal from "./ConfirmationModal";
import { CheckCircle, AlertCircle, Trash2, Edit } from "lucide-react";

const DebtTable = ({
  debts,
  overdueDebts,
  displayedDebts,
  openPopup,
  showOverdueOnly,
  setShowOverdueOnly,
  handlePaidToggle,
  handleDelete,
  statusMessage,
}) => {
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [confirmMessage, setConfirmMessage] = useState("");
  const [actionToConfirm, setActionToConfirm] = useState(() => () => {});

  const handleConfirm = () => {
    actionToConfirm();
    setShowConfirmModal(false);
  };

  const handleCancel = () => {
    setShowConfirmModal(false);
  };

  return (
    <>
      <div className="flex flex-col gap-3 sm:flex-row justify-between items-center mb-6">
        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
          <button
            onClick={() => setShowOverdueOnly(false)}
            className={`px-6 py-2.5 rounded-xl font-bold text-xs uppercase tracking-widest transition-all ${
              !showOverdueOnly
                ? "bg-blue-700 text-white shadow-lg shadow-blue-100"
                : "bg-slate-100 text-slate-500 hover:bg-slate-200"
            }`}
          >
            All Activity
          </button>
          <button
            onClick={() => setShowOverdueOnly(true)}
            className={`px-6 py-2.5 rounded-xl font-bold text-xs uppercase tracking-widest transition-all ${
              showOverdueOnly
                ? "bg-red-600 text-white shadow-lg shadow-red-100"
                : "bg-slate-100 text-slate-500 hover:bg-slate-200"
            }`}
          >
            Overdue ({overdueDebts.length})
          </button>
        </div>

        {statusMessage.message && (
          <div
            className={`px-4 py-2 rounded-xl text-sm font-semibold flex items-center gap-2 transition-all ${
              statusMessage.type === "success"
                ? "bg-emerald-50 text-emerald-700 border border-emerald-100"
                : "bg-amber-50 text-amber-700 border border-amber-100"
            }`}
          >
            {statusMessage.type === "success" ? <CheckCircle size={14} /> : <AlertCircle size={14} />}
            {statusMessage.message}
          </div>
        )}
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-lg">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50/50">
              <tr>
                <th className="px-6 py-4 text-left text-[10px] font-bold uppercase tracking-[0.15em] text-slate-500">
                  Customer Profile
                </th>
                <th className="px-6 py-4 text-left text-[10px] font-bold uppercase tracking-[0.15em] text-slate-500">
                  Item Details
                </th>
                <th className="px-6 py-4 text-left text-[10px] font-bold uppercase tracking-[0.15em] text-slate-500">
                  Valuation
                </th>
                <th className="px-6 py-4 text-left text-[10px] font-bold uppercase tracking-[0.15em] text-slate-500">
                  Timeline
                </th>
                <th className="px-6 py-4 text-center text-[10px] font-bold uppercase tracking-[0.15em] text-slate-500">
                  Status
                </th>
                <th className="px-6 py-4 text-center text-[10px] font-bold uppercase tracking-[0.15em] text-slate-500">
                  Operations
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {displayedDebts.length > 0 ? (
                displayedDebts.map((debt) => (
                  <tr
                    key={debt.id}
                    className={`transition-colors hover:bg-slate-50/50 ${
                      debt.isPaid ? "bg-slate-50/30 opacity-60" : ""
                    }`}
                  >
                    <td className="px-6 py-4">
                      <p className="text-sm font-bold text-slate-900 leading-tight">
                        {debt.customerFirstName} {debt.customerLastName}
                      </p>
                      <p className="text-[10px] text-slate-400 font-medium uppercase tracking-wider mt-0.5">
                        Client
                      </p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm font-semibold text-slate-700">
                        {debt.itemName}
                      </p>
                      <p className="text-xs text-slate-400">
                        Qty: {debt.itemQuantity}
                      </p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm font-black text-slate-900">
                        KSh {debt.totalAmount.toLocaleString()}
                      </p>
                      <p className="text-[10px] text-slate-400 font-bold uppercase">
                        Outstanding
                      </p>
                    </td>
                    <td className="px-6 py-4 space-y-1">
                      <div className="flex items-center gap-2 text-xs">
                         <span className="text-slate-400 font-medium uppercase text-[9px]">In:</span>
                         <span className="text-slate-600 font-bold">{new Date(debt.dateTaken).toLocaleDateString()}</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs">
                         <span className="text-slate-400 font-medium uppercase text-[9px]">Due:</span>
                         <span className={`font-black ${!debt.isPaid && new Date(debt.returnDate) < new Date() ? "text-red-600" : "text-blue-600"}`}>
                           {new Date(debt.returnDate).toLocaleDateString()}
                         </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <button
                        onClick={() => {
                          setShowConfirmModal(true);
                          setConfirmMessage(
                            `Are you sure you want to mark this debt as ${
                              debt.isPaid ? "unpaid" : "paid"
                            }?`
                          );
                          setActionToConfirm(() => () => handlePaidToggle(debt));
                        }}
                        className={`inline-flex items-center justify-center p-2 rounded-xl border transition-all ${
                          debt.isPaid 
                            ? "bg-emerald-50 text-emerald-600 border-emerald-100" 
                            : "bg-slate-50 text-slate-400 border-slate-200 hover:text-blue-600 hover:border-blue-200"
                        }`}
                      >
                         <CheckCircle size={18} fill={debt.isPaid ? "currentColor" : "transparent"} className={debt.isPaid ? "text-white" : ""} />
                      </button>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex justify-center gap-2">
                        <button
                          onClick={() => openPopup(debt)}
                          className="p-2 rounded-xl text-blue-600 hover:bg-blue-50 transition-colors"
                          title="Edit Record"
                        >
                          <Edit size={16} />
                        </button>
                        <button
                          onClick={() => {
                            setShowConfirmModal(true);
                            setConfirmMessage(
                              "Are you sure that you want to carry out this operation? You are about to permanently delete this debt record."
                            );
                            setActionToConfirm(() => () => handleDelete(debt.id));
                          }}
                          className="p-2 rounded-xl text-red-600 hover:bg-red-50 transition-colors"
                          title="Delete Record"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center justify-center text-slate-400 italic">
                      <p>No matching debt records found.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showConfirmModal && (
        <ConfirmationModal
          message={confirmMessage}
          onConfirm={handleConfirm}
          onCancel={handleCancel}
        />
      )}
    </>
  );
};

export default DebtTable;
