"use client";

import React, { useState, useEffect, useRef } from "react";
import { addDoc, collection, doc, updateDoc, getDoc } from "firebase/firestore";
import { Package, X } from "lucide-react";
import { query, onSnapshot } from "firebase/firestore";
import PageLoader from "@/app/components/PageLoader";

const RecordSaleModal = ({ isOpen, onClose, userId, db, initialData }) => {
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

    setIsFetchingStock(true); // 2. Use new state
    const q = query(collection(db, `users/${userId}/items`));
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const items = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setStockItems(items);
        setIsFetchingStock(false); // 2. Use new state
      },
      (error) => {
        console.error("Error fetching stock items: ", error);
        setMessage("Failed to fetch stock items. Please try again.");
        setIsFetchingStock(false); // 2. Use new state
      }
    );

    return () => unsubscribe();
  }, [userId, db, isOpen]);

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
    const totalRevenue = selectedItem.sellingPrice * quantity;
    const totalCost = selectedItem.buyingPrice * quantity;
    const profit = totalRevenue - totalCost;

    try {
      // --- Inventory Update Logic Start ---
      const itemRef = doc(db, `users/${userId}/items`, selectedItem.id);

      const itemSnap = await getDoc(itemRef);
      const currentItemData = itemSnap.data();

      let stockAdjustment = 0;

      if (initialData && initialData.id) {
        // EDITING an existing sale
        const oldQuantity = Number(initialData.quantity) || 0;
        stockAdjustment = oldQuantity - quantity;
      } else {
        // RECORDING a NEW sale
        stockAdjustment = -quantity;
      }

      const newStockQuantity =
        (currentItemData.quantity || 0) + stockAdjustment;

      if (newStockQuantity < 0) {
        setMessage(`Not enough stock. Only ${currentItemData.quantity} left.`);
        setIsLoading(false);
        return;
      }

      // Update the item's stock quantity
      await updateDoc(itemRef, {
        quantity: newStockQuantity,
      });

      // --- Inventory Update Logic End ---

      // --- Sales Record Save Logic ---
      const salesData = {
        itemId: selectedItem.id,
        itemName: selectedItem.name,
        itemPrice: selectedItem.sellingPrice,
        unitCost: selectedItem.buyingPrice,
        totalRevenue: totalRevenue,
        totalCost: totalCost,
        profit: profit,
        quantity: quantity,
        saleDate: new Date(),
        itemCategory: selectedItem.category,
      };

      if (initialData && initialData.id) {
        const saleRef = doc(db, `users/${userId}/sales`, initialData.id);
        await updateDoc(saleRef, salesData);
        setMessage("Sale updated successfully!");
      } else {
        await addDoc(collection(db, `users/${userId}/sales`), salesData);
        setMessage("Sale recorded successfully!");
      }

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
