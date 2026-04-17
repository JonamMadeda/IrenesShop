"use client";

import React from "react";
import { AlertTriangle } from "lucide-react";

const ConfirmationModal = ({ message, onConfirm, onCancel }) => (
  <div className="fixed inset-0 bg-gray-100 bg-opacity-50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
    <div className="bg-white p-8 rounded-lg shadow-xl max-w-sm w-full text-center">
      <div className="flex items-center justify-center gap-3 mb-4 text-red-600">
        <AlertTriangle className="h-6 w-6" />
        <h3 className="text-lg font-semibold text-gray-900">Deletion Confirmation</h3>
      </div>
      <p className="text-base mb-4 text-gray-800">{message}</p>
      <p className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-xl p-3 mb-4">
        Warning: This is a high-risk action. Deleted records cannot be restored after confirmation.
      </p>
      <div className="flex justify-center space-x-4">
        <button
          onClick={onConfirm}
          className="px-4 py-2 rounded-xl font-bold text-sm text-white transition-all duration-300 transform bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-4 focus:ring-red-300 active:scale-95"
        >
          Confirm Deletion
        </button>
        <button
          onClick={onCancel}
          className="px-4 py-2 rounded-xl font-bold text-sm text-gray-800 transition-all duration-300 transform bg-gray-200 hover:bg-gray-300 focus:outline-none focus:ring-4 focus:ring-gray-300 active:scale-95"
        >
          Cancel
        </button>
      </div>
    </div>
  </div>
);

export default ConfirmationModal;
