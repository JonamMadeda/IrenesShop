// _components/DateFilter.jsx

import React, { useState } from "react";

// Helper function to format the date as 'MM/DD/YYYY' for display
const formatDate = (dateString) => {
  const date = new Date(dateString);
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const year = date.getFullYear();
  return `${month}/${day}/${year}`;
};

const DateFilter = ({
  selectedDate,
  setSelectedDate,
  activeRange,
  setActiveRange,
}) => {
  // Use 'Daily', 'Weekly', 'Monthly', 'Yearly' as range options
  const ranges = ["Daily", "Weekly", "Monthly", "Yearly"];

  return (
    <div className="bg-white rounded-xl shadow-lg p-4 mb-8">
      <div className="flex flex-col sm:flex-row items-center justify-between space-y-4 sm:space-y-0">
        {/* Date Selector */}
        <div className="flex items-center space-x-3">
          <label
            htmlFor="date-select"
            className=" text-sm md:text-lg text-gray-700 font-medium whitespace-nowrap"
          >
            Select a Date
          </label>
          <div className="relative">
            <input
              id="date-select"
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-xl focus:ring-blue-500 focus:border-blue-500 text-sm appearance-none pr-2 cursor-pointer"
            />
         
          </div>
        </div>

        {/* Range Selector Buttons */}
        <div className="flex space-x-2 p-2 bg-gray-100 rounded-xl">
          {ranges.map((range) => (
            <button
              key={range}
              onClick={() => setActiveRange(range)}
              className={`px-1 sm:px-4 py-2 rounded-lg font-semibold text-sm transition-all duration-200 ${
                activeRange === range
                  ? "bg-blue-600 text-white shadow-md"
                  : "bg-transparent text-gray-700 hover:bg-white"
              }`}
            >
              {range}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default DateFilter;
