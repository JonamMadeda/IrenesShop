// _components/DebtHeader.jsx
import React from "react";

const DebtHeader = ({ openPopup }) => {
  return (
    <div className="mb-8 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
      <div className="max-w-3xl">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-blue-600">
          Debt Workspace
        </p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-900 flex items-center">
          Debt Management <span className="ml-2 text-2xl">📝</span>
        </h1>
        <p className="mt-2 text-sm text-slate-500">
          Track outstanding customer credits, monitor return deadlines, and manage debt conversion to sales once settled.
        </p>
      </div>

      <button
        onClick={openPopup}
        className="px-6 py-3 rounded-xl font-bold text-sm text-white transition-all duration-300 transform bg-blue-700 hover:bg-blue-800 focus:outline-none focus:ring-4 focus:ring-blue-300 active:scale-95 whitespace-nowrap shadow-md"
      >
        Record New Debt
      </button>
    </div>
  );
};

export default DebtHeader;
