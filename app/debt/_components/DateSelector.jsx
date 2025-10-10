import React from "react";
import { format } from "date-fns";

const DateSelector = ({
  currentDate,
  period,
  navigateDate,
  handleDateSelect,
  handlePeriodChange,
}) => {
  // Utility to format the date for display
  const formattedDate = format(currentDate, "MM/dd/yyyy");
  const longFormattedDate = format(currentDate, "EEEE, MMMM dd, yyyy");

  const periods = [
    { key: "daily", label: "Daily" },
    { key: "weekly", label: "Weekly" },
    { key: "monthly", label: "Monthly" },
    { key: "yearly", label: "Yearly" },
  ];

  // Helper to format the input type="date" value
  const dateInputFormat = format(currentDate, "yyyy-MM-dd");

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between p-4 bg-white rounded-xl shadow-lg border border-gray-200 mb-8">
      {/* Date Navigation and Display */}
      <div className="flex items-center space-x-4 mb-4 sm:mb-0">
        <button
          onClick={() => navigateDate("prev")}
          className="p-2 text-gray-600 hover:text-blue-600 transition-colors rounded-full"
          aria-label="Previous Period"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M15 19l-7-7 7-7"
            />
          </svg>
        </button>

        {/* Date Picker (Calendar Icon & Text) */}
        <div className="relative flex items-center bg-gray-50 rounded-lg border border-gray-300 transition-shadow hover:shadow-md">
          <input
            type="date"
            value={dateInputFormat}
            onChange={handleDateSelect}
            className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
            aria-label="Select Date"
          />
          <span className="pl-4 py-2 text-gray-700 font-medium pointer-events-none">
            {formattedDate}
          </span>
          <span className="p-2 text-gray-500 pointer-events-none">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
          </span>
        </div>

        <span className="hidden md:block text-gray-600 font-normal">
          {longFormattedDate}
        </span>

        <button
          onClick={() => navigateDate("next")}
          className="p-2 text-gray-600 hover:text-blue-600 transition-colors rounded-full"
          aria-label="Next Period"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M9 5l7 7-7 7"
            />
          </svg>
        </button>
      </div>

      {/* Period Selection Buttons */}
      <div className="flex space-x-1 bg-gray-50 p-1 rounded-lg">
        {periods.map((p) => (
          <button
            key={p.key}
            onClick={() => handlePeriodChange(p.key)}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-all ${
              period === p.key
                ? "bg-blue-600 text-white shadow-md"
                : "text-gray-700 hover:bg-gray-100"
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>
    </div>
  );
};

export default DateSelector;
