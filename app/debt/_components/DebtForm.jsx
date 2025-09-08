"use client";

import React, { useRef, useEffect } from "react";
import { XCircle } from "lucide-react";

const DebtForm = ({
  isPopupOpen,
  closePopup,
  handleSubmit,
  isLoading,
  currentRecord,
  customerFirstName,
  setCustomerFirstName,
  customerLastName,
  setCustomerLastName,
  phoneNumber,
  setPhoneNumber,
  itemName,
  setItemName,
  itemQuantity,
  setItemQuantity,
  itemPrice,
  setItemPrice,
  dateTaken,
  setDateTaken,
  returnDate,
  setReturnDate,
  items,
  isDropdownOpen,
  setIsDropdownOpen,
}) => {
  const dropdownRef = useRef(null);

  // Handle clicking outside of the dropdown to close it
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [dropdownRef, setIsDropdownOpen]);

  const handleItemSelect = (item) => {
    setItemName(item.name);
    setItemPrice(item.sellingPrice || 0);
    setIsDropdownOpen(false);
  };

  const filteredItems = items.filter((item) =>
    item.name.toLowerCase().includes(itemName.toLowerCase())
  );

  if (!isPopupOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 p-4 backdrop-filter backdrop-blur-sm bg-white/30">
      <div className="bg-white rounded-xl shadow-2xl p-6 sm:p-10 w-full max-w-2xl transform">
        <button
          onClick={closePopup}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
        >
          <XCircle size={24} />
        </button>
        <h2 className="text-2xl font-bold text-center text-gray-800 mb-6">
          {currentRecord ? "Edit Debt Record" : "Record New Debt Sale"}
        </h2>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <label
                htmlFor="customerFirstName"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Customer First Name
              </label>
              <input
                type="text"
                id="customerFirstName"
                value={customerFirstName}
                onChange={(e) => setCustomerFirstName(e.target.value)}
                required
                className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label
                htmlFor="customerLastName"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Customer Last Name
              </label>
              <input
                type="text"
                id="customerLastName"
                value={customerLastName}
                onChange={(e) => setCustomerLastName(e.target.value)}
                required
                className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          <div>
            <label
              htmlFor="phoneNumber"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Phone Number
            </label>
            <input
              type="tel"
              id="phoneNumber"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="relative" ref={dropdownRef}>
            <label
              htmlFor="itemName"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Item Name
            </label>
            <input
              type="text"
              id="itemName"
              value={itemName}
              onChange={(e) => {
                setItemName(e.target.value);
                setIsDropdownOpen(true);
              }}
              onFocus={() => setIsDropdownOpen(true)}
              required
              className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Search for an item..."
            />
            {isDropdownOpen && (
              <ul className="absolute z-10 w-full bg-white border border-gray-300 rounded-lg shadow-lg mt-1 max-h-60 overflow-y-auto">
                {filteredItems.length > 0 ? (
                  filteredItems.map((item) => (
                    <li
                      key={item.id}
                      className="p-3 hover:bg-gray-100 cursor-pointer text-gray-800 transition-colors"
                      onClick={() => handleItemSelect(item)}
                    >
                      {item.name}
                    </li>
                  ))
                ) : (
                  <li className="p-3 text-gray-500 text-sm">
                    No items match your search.
                  </li>
                )}
              </ul>
            )}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <label
                htmlFor="itemQuantity"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Quantity
              </label>
              <input
                type="number"
                id="itemQuantity"
                value={itemQuantity}
                onChange={(e) => setItemQuantity(Number(e.target.value))}
                min="1"
                required
                className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label
                htmlFor="itemPrice"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Price per Item (Ksh)
              </label>
              <input
                type="number"
                id="itemPrice"
                value={itemPrice}
                readOnly
                className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50 text-gray-500"
              />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <label
                htmlFor="dateTaken"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Date Taken
              </label>
              <input
                type="date"
                id="dateTaken"
                value={dateTaken}
                onChange={(e) => setDateTaken(e.target.value)}
                required
                className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label
                htmlFor="returnDate"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Return Date
              </label>
              <input
                type="date"
                id="returnDate"
                value={returnDate}
                onChange={(e) => setReturnDate(e.target.value)}
                required
                className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          <div className="flex justify-center space-x-4 pt-4">
            <button
              type="submit"
              disabled={isLoading}
              className={`w-full sm:w-auto px-6 py-3 rounded-xl font-bold text-sm text-white transition-all duration-300 transform ${
                isLoading
                  ? "bg-gray-400 cursor-not-allowed"
                  : "bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-4 focus:ring-blue-300 active:scale-95"
              }`}
            >
              {isLoading
                ? "Saving..."
                : currentRecord
                ? "Update Record"
                : "Save Record"}
            </button>
            <button
              type="button"
              onClick={closePopup}
              disabled={isLoading}
              className={`w-full sm:w-auto px-6 py-3 rounded-xl font-bold text-sm transition-all duration-300 transform border border-gray-300 ${
                isLoading
                  ? "text-gray-400 cursor-not-allowed"
                  : "text-gray-600 hover:bg-gray-100 active:scale-95"
              }`}
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default DebtForm;
