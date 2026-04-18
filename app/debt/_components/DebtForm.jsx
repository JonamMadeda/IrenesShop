"use client";

import React, { useRef, useEffect } from "react";
import { XCircle, User, Phone, Package, Calendar, Hash } from "lucide-react";

const InputGroup = ({ label, icon: Icon, children }) => (
  <div className="space-y-1.5">
    <label className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-slate-400 ml-1">
      <Icon size={12} />
      {label}
    </label>
    {children}
  </div>
);

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

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [dropdownRef, setIsDropdownOpen]);

  const handleItemSelect = (item) => {
    setItemName(item.name);
    setItemPrice(item.sellingPrice || 0);
    setIsDropdownOpen(false);
  };

  const filteredItems = items.filter((item) =>
    item.name.toLowerCase().includes((itemName || "").toLowerCase())
  );

  if (!isPopupOpen) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 p-4 backdrop-blur-md bg-slate-900/40">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl transform max-h-[90vh] overflow-hidden flex flex-col border border-slate-200">
        
        {/* Header */}
        <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div>
            <h2 className="text-xl font-bold text-slate-900">
              {currentRecord ? "Edit Debt Record" : "New Debt Sale"}
            </h2>
            <p className="text-xs text-slate-500 font-medium mt-1">
              {currentRecord ? `Modifying entry for ${customerFirstName}` : "Register a new credit transaction"}
            </p>
          </div>
          <button
            onClick={closePopup}
            className="p-2 rounded-xl text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-all"
          >
            <XCircle size={22} />
          </button>
        </div>

        {/* Form Body */}
        <div className="flex-1 overflow-y-auto p-8">
          <form onSubmit={handleSubmit} className="space-y-8">
            
            {/* Customer Section */}
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <InputGroup label="First Name" icon={User}>
                  <input
                    type="text"
                    value={customerFirstName ?? ""}
                    onChange={(e) => setCustomerFirstName(e.target.value)}
                    required
                    placeholder="Enter first name"
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:ring-4 focus:ring-blue-100 focus:border-blue-500 outline-none transition-all"
                  />
                </InputGroup>
                <InputGroup label="Last Name" icon={User}>
                  <input
                    type="text"
                    value={customerLastName ?? ""}
                    onChange={(e) => setCustomerLastName(e.target.value)}
                    required
                    placeholder="Enter last name"
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:ring-4 focus:ring-blue-100 focus:border-blue-500 outline-none transition-all"
                  />
                </InputGroup>
              </div>
              <InputGroup label="Contact Phone" icon={Phone}>
                <input
                  type="tel"
                  value={phoneNumber ?? ""}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  placeholder="+254..."
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:ring-4 focus:ring-blue-100 focus:border-blue-500 outline-none transition-all"
                />
              </InputGroup>
            </div>

            <div className="h-px bg-slate-100" />

            {/* Item Section */}
            <div className="space-y-4">
              <div className="relative" ref={dropdownRef}>
                <InputGroup label="Inventory Item" icon={Package}>
                  <input
                    type="text"
                    value={itemName ?? ""}
                    onChange={(e) => {
                      setItemName(e.target.value);
                      setIsDropdownOpen(true);
                    }}
                    onFocus={() => setIsDropdownOpen(true)}
                    required
                    placeholder="Search stock..."
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:ring-4 focus:ring-blue-100 focus:border-blue-500 outline-none transition-all"
                  />
                </InputGroup>
                {isDropdownOpen && (
                  <ul className="absolute z-20 w-full bg-white border border-slate-200 rounded-xl shadow-xl mt-2 max-h-48 overflow-y-auto p-2 space-y-1">
                    {filteredItems.length > 0 ? (
                      filteredItems.map((item) => (
                        <li
                          key={item.id}
                          className="p-2.5 hover:bg-blue-50 rounded-lg cursor-pointer text-sm font-bold text-slate-700 transition-colors flex justify-between items-center"
                          onClick={() => handleItemSelect(item)}
                        >
                          <span>{item.name}</span>
                          <span className="text-[10px] text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-100">
                             KSh {item.sellingPrice?.toLocaleString()}
                          </span>
                        </li>
                      ))
                    ) : (
                      <li className="p-4 text-slate-400 text-xs text-center italic">
                        No matches in inventory
                      </li>
                    )}
                  </ul>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <InputGroup label="Order Quantity" icon={Hash}>
                  <input
                    type="number"
                    value={itemQuantity || ""}
                    onChange={(e) => setItemQuantity(Number(e.target.value))}
                    min="1"
                    required
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:ring-4 focus:ring-blue-100 focus:border-blue-500 outline-none transition-all"
                  />
                </InputGroup>
                <InputGroup label="Unit Price" icon={Hash}>
                  <div className="w-full p-3 bg-slate-100 border border-slate-200 rounded-xl text-sm font-bold text-slate-500 flex justify-between items-center">
                    <span>KSh</span>
                    <span>{(itemPrice || 0).toLocaleString()}</span>
                  </div>
                </InputGroup>
              </div>
            </div>

            <div className="h-px bg-slate-100" />

            {/* Dates Section */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pb-4">
              <InputGroup label="Transaction Date" icon={Calendar}>
                <input
                  type="date"
                  value={dateTaken ?? ""}
                  onChange={(e) => setDateTaken(e.target.value)}
                  required
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:ring-4 focus:ring-blue-100 focus:border-blue-500 outline-none transition-all"
                />
              </InputGroup>
              <InputGroup label="Commitment Date" icon={Calendar}>
                <input
                  type="date"
                  value={returnDate ?? ""}
                  onChange={(e) => setReturnDate(e.target.value)}
                  required
                  className="w-full p-3 bg-amber-50/50 border border-amber-100 rounded-xl text-sm font-bold text-amber-900 focus:ring-4 focus:ring-amber-100 focus:border-amber-400 outline-none transition-all"
                />
              </InputGroup>
            </div>
          </form>
        </div>

        {/* Footer Actions */}
        <div className="p-6 bg-slate-50 border-t border-slate-100 flex flex-col sm:flex-row gap-3">
          <button
            type="submit"
            onClick={handleSubmit}
            disabled={isLoading}
            className={`flex-1 px-6 py-3.5 rounded-2xl font-black text-xs uppercase tracking-[0.15em] text-white transition-all shadow-lg ${
              isLoading
                ? "bg-slate-400 cursor-not-allowed"
                : "bg-blue-700 hover:bg-blue-800 shadow-blue-100 active:scale-95"
            }`}
          >
            {isLoading
              ? "Updating Ledger..."
              : currentRecord
              ? "Finalize Changes"
              : "Register Debt Record"}
          </button>
          <button
            type="button"
            onClick={closePopup}
            className="px-8 py-3.5 rounded-2xl font-black text-xs uppercase tracking-[0.15em] text-slate-500 hover:bg-white hover:text-slate-800 border border-transparent hover:border-slate-200 transition-all"
          >
            Discard
          </button>
        </div>
      </div>
    </div>
  );
};

export default DebtForm;
