"use client";

import React, { useState, useEffect, useRef } from "react";
// Firebase imports removed
import { Package, X } from "lucide-react";
// Firebase query imports removed
import PageLoader from "@/app/components/PageLoader";

const RecordSaleModal = ({ isOpen, onClose, userId, supabase, initialData, onSaleSaved }) => {
  const [formData, setFormData] = useState({
    itemId: "",
    itemName: "",
    quantity: "",
  });
  const [stockItems, setStockItems] = useState([]);
  const [isFetchingStock, setIsFetchingStock] = useState(true); // 1. NEW STATE for initial data fetch
  const [isLoading, setIsLoading] = useState(false); // Renamed state for form submission
  const [message, setMessage] = useState("");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Fetch stock items when modal opens
  useEffect(() => {
    if (!userId || !isOpen) return;

    const fetchStock = async () => {
      setIsFetchingStock(true);
      const { data, error } = await supabase
        .from("items")
        .select("*")
        .eq("user_id", userId);
      
      if (error) {
        console.error("Error fetching stock items: ", error);
        setMessage("Failed to fetch stock items. Please try again.");
      } else {
        setStockItems(data || []);
      }
      setIsFetchingStock(false);
    };

    fetchStock();
  }, [userId, supabase, isOpen]);

  // Handle clicking outside of the dropdown
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
  }, []);

  // Set initial data for editing
  useEffect(() => {
    if (initialData) {
      setFormData({
        itemId: initialData.itemId || "",
        itemName: initialData.itemName || "",
        quantity: initialData.quantity || "",
      });
    } else {
      setFormData({
        itemId: "",
        itemName: "",
        quantity: "",
      });
    }
  }, [initialData, isOpen]);

  if (!isOpen) return null;

  const handleItemChange = (e) => {
    const { value } = e.target;
    setFormData((prev) => ({
      ...prev,
      itemName: value,
      itemId: "", // Reset itemId when the user types
    }));
    setIsDropdownOpen(true);
  };

  const handleItemSelect = (item) => {
    setFormData((prev) => ({
      ...prev,
      itemName: item.name,
      itemId: item.id,
    }));
    setIsDropdownOpen(false);
  };

  const handleQuantityChange = (e) => {
    const { value } = e.target;
    setFormData((prev) => ({
      ...prev,
      quantity: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true); // Use new state for form submission
    setMessage("");

    if (!userId) {
      setMessage("User not authenticated. Please wait and try again.");
      setIsLoading(false);
      return;
    }

    if (!formData.itemId || !formData.quantity) {
      setMessage("Please select an item and enter a quantity.");
      setIsLoading(false);
      return;
    }

    const selectedItem = stockItems.find((item) => item.id === formData.itemId);

    if (!selectedItem) {
      setMessage("Selected item not found in stock.");
      setIsLoading(false);
      return;
    }

    const quantity = Number(formData.quantity);
    const itemPrice = Number(selectedItem.price ?? 0);
    const itemCost = Number(selectedItem.cost ?? 0);
    const total_revenue = itemPrice * quantity;
    const total_cost = itemCost * quantity;
    const profit = total_revenue - total_cost;

    try {
      // --- Inventory Update Logic Start ---
      const { data: currentItemData, error: fetchError } = await supabase
        .from("items")
        .select("*")
        .eq("id", selectedItem.id)
        .eq("user_id", userId)
        .single();

      if (fetchError || !currentItemData) throw new Error("Item not found");

      let stockAdjustment = 0;
      if (initialData && initialData.id) {
        const oldQuantity = Number(initialData.quantity) || 0;
        stockAdjustment = oldQuantity - quantity;
      } else {
        stockAdjustment = -quantity;
      }

      const newStockQuantity = (currentItemData.quantity || 0) + stockAdjustment;

      if (newStockQuantity < 0) {
        setMessage(`Not enough stock. Only ${currentItemData.quantity} left.`);
        setIsLoading(false);
        return;
      }

      const { error: updateError } = await supabase
        .from("items")
        .update({ quantity: newStockQuantity })
        .eq("id", selectedItem.id)
        .eq("user_id", userId);

      if (updateError) throw updateError;
      // --- Inventory Update Logic End ---

      const salesData = {
        item_id: selectedItem.id,
        item_name: selectedItem.name,
        total_revenue: total_revenue,
        total_cost: total_cost,
        profit: profit,
        quantity: quantity,
        sale_date: new Date(),
        item_category: selectedItem.category,
        user_id: userId,
      };

      if (initialData && initialData.id) {
        const { error: saleUpdateError } = await supabase
          .from("sales")
          .update(salesData)
          .eq("id", initialData.id)
          .eq("user_id", userId);
        if (saleUpdateError) throw saleUpdateError;
        setMessage("Sale updated successfully!");
      } else {
        const { error: saleInsertError } = await supabase
          .from("sales")
          .insert(salesData);
        if (saleInsertError) throw saleInsertError;
        setMessage("Sale recorded successfully!");
      }
      if (onSaleSaved) onSaleSaved();

      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (error) {
      console.error("Error saving sale: ", error);
      setMessage("Failed to save sale. Please check the console for details.");
    } finally {
      setIsLoading(false);
    }
  };

  const filteredItems = stockItems.filter((item) =>
    item.name.toLowerCase().includes(formData.itemName.toLowerCase())
  );

  // 3. Conditional rendering check
  if (isFetchingStock) {
    return <PageLoader />;
  }

  return (
    <div
      className="fixed inset-0 flex items-center justify-center bg-white/30 backdrop-blur-sm z-50"
      aria-labelledby="modal-title"
      role="dialog"
      aria-modal="true"
    >
      <div className="relative p-8 bg-white w-96 max-w-md mx-auto rounded-xl shadow-lg font-sans">
        <div className="flex justify-between items-start">
          <h3 className="text-xl font-semibold text-gray-800">
            {initialData ? "Edit Sale Record" : "Record New Sale"}
          </h3>
          <button
            className="text-gray-400 hover:text-gray-600"
            onClick={onClose}
            disabled={isLoading}
          >
            <X size={24} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div className="relative" ref={dropdownRef}>
            <label
              htmlFor="itemName"
              className="block text-sm font-medium text-gray-700"
            >
              Select Item
            </label>
            <div className="mt-1 relative rounded-md shadow-sm">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                <Package className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                name="itemName"
                id="itemName"
                value={formData.itemName}
                onChange={handleItemChange}
                onFocus={() => setIsDropdownOpen(true)}
                className="block w-full rounded-md border border-gray-300 bg-white py-2 pl-10 pr-3 leading-5 placeholder-gray-500 transition-colors focus:border-blue-500 focus:outline-none focus:ring-blue-500"
                placeholder="Search for an item..."
                required
              />
            </div>
            {isDropdownOpen && (
              <ul className="absolute z-10 mt-1 max-h-60 w-full overflow-y-auto rounded-lg border border-gray-300 bg-white shadow-lg">
                {filteredItems.length > 0 ? (
                  filteredItems.map((item) => (
                    <li
                      key={item.id}
                      className="cursor-pointer p-3 text-gray-800 transition-colors hover:bg-gray-100"
                      onClick={() => handleItemSelect(item)}
                    >
                      {item.name}
                      <span className="ml-2 text-sm text-gray-500">
                        ({item.quantity} remaining)
                      </span>
                    </li>
                  ))
                ) : (
                  <li className="p-3 text-sm text-gray-500">
                    No items match your search.
                  </li>
                )}
              </ul>
            )}
          </div>
          <div>
            <label
              htmlFor="quantity"
              className="block text-sm font-medium text-gray-700"
            >
              Quantity Sold
            </label>
            <input
              type="number"
              name="quantity"
              id="quantity"
              value={formData.quantity}
              onChange={handleQuantityChange}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 placeholder-gray-400 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
              placeholder="e.g., 2"
              required
              min="1"
            />
          </div>
          {message && (
            <p
              className={`mt-2 text-center text-sm font-medium ${
                message.includes("success") ? "text-green-600" : "text-red-600"
              }`}
            >
              {message}
            </p>
          )}
          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-200 focus:ring-offset-2"
              disabled={isLoading}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              {isLoading
                ? "Saving..."
                : initialData
                ? "Update Sale"
                : "Record Sale"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RecordSaleModal;
