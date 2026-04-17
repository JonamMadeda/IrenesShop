"use client";

import React, { useState } from "react";
import ConfirmationModal from "./ConfirmationModal";
// Removed: import DebtSummary from "./DebtSummary";

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

  // The summary calculations (totalDebts, totalDebtAmount, etc.) are still here
  // but are not being passed to or rendered by the DebtSummary component anymore.
  const totalDebts = debts.length;
  const totalDebtAmount = debts.reduce(
    (sum, debt) => sum + debt.totalAmount,
    0
  );
  const totalOverdueAmount = overdueDebts.reduce(
    (sum, debt) => sum + debt.totalAmount,
    0
  );
  const totalItems = debts.reduce((sum, debt) => sum + debt.itemQuantity, 0);

  const handleConfirm = () => {
    actionToConfirm();
    setShowConfirmModal(false);
  };

  const handleCancel = () => {
    setShowConfirmModal(false);
  };

  return (
    <>
      {/* Removed: Title and 'Record New Debt' button
      
      <div className="flex flex-col sm:flex-row justify-between items-center space-y-2 mb-8">
        <h1 className="text-2xl sm:text-4xl font-bold text-gray-900 tracking-tight">
          Debt Records
        </h1>
        <button
          onClick={() => openPopup()}
          className="px-6 py-3 rounded-xl font-bold text-sm text-white transition-all duration-300 transform bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-4 focus:ring-blue-300 active:scale-95"
        >
          Record New Debt
        </button>
      </div>
      */}

      {/* Removed: DebtSummary component */}
      {/* <DebtSummary
        totalDebts={totalDebts}
        totalDebtAmount={totalDebtAmount}
        totalOverdueAmount={totalOverdueAmount}
        totalItems={totalItems}
      />
      */}

      <div className="flex flex-col gap-2 sm:gap-0 sm:flex-row justify-center sm:justify-start mb-6 sm:space-x-4">
        <button
          onClick={() => setShowOverdueOnly(false)}
          className={`px-4 py-2 rounded-xl font-semibold text-sm transition-colors duration-300 ${
            showOverdueOnly
              ? "bg-gray-200 text-gray-700 hover:bg-gray-300"
              : "bg-blue-600 text-white shadow-md hover:bg-blue-700"
          }`}
        >
          All Records
        </button>
        <button
          onClick={() => setShowOverdueOnly(true)}
          className={`px-4 py-2 rounded-xl font-semibold text-sm transition-colors duration-300 ${
            !showOverdueOnly
              ? "bg-gray-200 text-gray-700 hover:bg-gray-300"
              : "bg-red-500 text-white shadow-md hover:bg-red-600"
          }`}
        >
          Overdue Debts ({overdueDebts.length})
        </button>
      </div>
      {statusMessage.message && (
        <div
          className={`p-4 rounded-lg text-center font-medium mb-6 transition-colors duration-300 ${
            statusMessage.type === "success"
              ? "bg-green-100 text-green-700 border border-green-200"
              : "bg-red-100 text-red-700 border border-red-200"
          }`}
        >
          {statusMessage.message}
        </div>
      )}
      <div className="overflow-x-auto rounded-lg shadow-inner">
        <table className="min-w-full bg-white border border-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Customer
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Item
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Total Amount
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Date Taken
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Return Date
              </th>
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="relative px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {displayedDebts.length > 0 ? (
              displayedDebts.map((debt) => (
                <tr
                  key={debt.id}
                  className={`hover:bg-gray-50 ${
                    debt.isPaid ? "text-gray-400 italic" : ""
                  }`}
                >
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    {debt.customerFirstName} {debt.customerLastName}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {debt.itemName} ({debt.itemQuantity})
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    Ksh {debt.totalAmount.toFixed(2)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {debt.dateTaken}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {debt.returnDate}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-center">
                    <input
                      type="checkbox"
                      checked={debt.isPaid}
                      onChange={() => {
                        setShowConfirmModal(true);
                        setConfirmMessage(
                          `Are you sure you want to mark this debt as ${
                            debt.isPaid ? "unpaid" : "paid"
                          }?`
                        );
                        setActionToConfirm(() => () => handlePaidToggle(debt));
                      }}
                      className="form-checkbox h-5 w-5 text-blue-600 rounded-full"
                    />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex justify-center space-x-4">
                      <button
                        onClick={() => openPopup(debt)}
                        className="text-blue-600 hover:text-blue-900 transition-colors duration-200"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => {
                          setShowConfirmModal(true);
                          setConfirmMessage(
                            "Are you sure that you want to carry out this operation? You are about to permanently delete this debt record. This is a high-risk action, and deleted data cannot be recovered."
                          );
                          setActionToConfirm(() => () => handleDelete(debt.id));
                        }}
                        className="text-red-600 hover:text-red-900 transition-colors duration-200"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="7" className="px-6 py-4 text-center text-gray-500">
                  No records found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
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
