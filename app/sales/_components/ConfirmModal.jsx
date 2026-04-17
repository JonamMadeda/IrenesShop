import React from "react";
import { AlertTriangle } from "lucide-react";

const ConfirmModal = ({ message, onConfirm, onCancel }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-white bg-opacity-30 backdrop-blur-sm transition-opacity duration-300">
      <div className="bg-white p-6 rounded-2xl shadow-xl w-full max-w-sm mx-4 transform transition-transform duration-300 scale-100">
        <div className="flex items-center gap-3 mb-4 text-red-600">
          <AlertTriangle className="h-6 w-6" />
          <h3 className="text-lg font-semibold text-gray-900">Deletion Confirmation</h3>
        </div>
        <p className="text-gray-800 text-base mb-3">{message}</p>
        <p className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-xl p-3 mb-6">
          Warning: This is a high-risk action. Once this record is deleted, it cannot be recovered.
        </p>
        <div className="flex justify-end space-x-4">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-xl hover:bg-gray-300 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-xl hover:bg-red-700 transition-colors"
          >
            Confirm Deletion
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmModal;
