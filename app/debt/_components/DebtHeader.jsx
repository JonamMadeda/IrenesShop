// _components/DebtHeader.jsx
import React from "react";

const DebtHeader = ({ openPopup }) => {
  return (
    <div className="flex flex-col sm:flex-row justify-between items-center space-y-2 mb-8">
      {/* Title with the Sales-like styling (large, bold, and with an emoji) */}
      <h1 className="text-2xl sm:text-4xl font-bold text-gray-900 tracking-tight flex items-center">
        Debt Records <span className="ml-2 text-3xl">📝</span>
      </h1>

      {/* Button styled like the "Record New Sale" button */}
      <button
        onClick={openPopup}
        className="px-6 py-3 rounded-xl font-bold text-sm text-white transition-all duration-300 transform bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-4 focus:ring-blue-300 active:scale-95 whitespace-nowrap"
      >
        Record New Debt
      </button>
    </div>
  );
};

export default DebtHeader;
