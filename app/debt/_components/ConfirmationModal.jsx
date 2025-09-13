"use client";

import React from "react";

const ConfirmationModal = ({ message, onConfirm, onCancel }) => (
  <div className="fixed inset-0 bg-gray-100 bg-opacity-50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
    <div className="bg-white p-8 rounded-lg shadow-xl max-w-sm w-full text-center">
      <p className="text-lg font-semibold mb-4 text-gray-800">{message}</p>
      <div className="flex justify-center space-x-4">
        <button
          onClick={onConfirm}
          className="px-4 py-2 rounded-xl font-bold text-sm text-white transition-all duration-300 transform bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-4 focus:ring-red-300 active:scale-95"
        >
          Confirm
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
