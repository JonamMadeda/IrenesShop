"use client";
import React, { useState } from "react";
import { ShoppingBag, Loader, Search, AlertTriangle } from "lucide-react"; // Added AlertTriangle
// Firebase imports removed

const AddItem = ({ onClose, showAlert, categories, supabase, userId, onItemAdded }) => {
  const [itemName, setItemName] = useState("");
  const [quantity, setQuantity] = useState("");
  const [category, setCategory] = useState("");
  const [buyingPrice, setBuyingPrice] = useState("");
  const [sellingPrice, setSellingPrice] = useState("");
  const [loading, setLoading] = useState(false);

  // State for the searchable dropdown functionality
  const [categorySearchTerm, setCategorySearchTerm] = useState("");
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);

  // Check if categories array is empty
  const hasCategories = categories && categories.length > 0;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!userId) {
      showAlert("User not authenticated. Please try again.", "Error!");
      return;
    }
    // Final check for category presence
    if (!hasCategories) {
      showAlert("Please create a category before adding an item.", "Error!");
      return;
    }
    // Ensure a category is selected (not just a search term entered)
    if (!category) {
      showAlert("Please select a category.", "Error!");
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.from("items").insert({
        name: itemName,
        quantity: Number(quantity),
        category,
        cost: Number(buyingPrice),
        price: Number(sellingPrice),
        user_id: userId,
        created_at: new Date(),
      });
      if (error) throw error;
      showAlert(`Item "${itemName}" added!`, "Success!");
      if (onItemAdded) onItemAdded();
      // Reset states
      setItemName("");
      setQuantity("");
      setCategory("");
      setBuyingPrice("");
      setSellingPrice("");
      setCategorySearchTerm("");
      setShowCategoryDropdown(false);
      onClose();
    } catch (err) {
      console.error(err);
      showAlert("Error adding item", "Error!");
    } finally {
      setLoading(false);
    }
  };

  const handleCategorySelection = (categoryName) => {
    setCategory(categoryName);
    setCategorySearchTerm(categoryName);
    setShowCategoryDropdown(false);
  };

  const filteredCategories = categories.filter((cat) =>
    cat.name.toLowerCase().includes(categorySearchTerm.toLowerCase())
  );

  return (
    <div className="w-full flex flex-col">
      {/* Header */}
      <div className="flex items-center space-x-2 mb-6">
        <div className="p-2 rounded-lg bg-blue-100 text-blue-700">
          <ShoppingBag className="w-5 h-5" />
        </div>
        <h2 className="text-xl font-semibold text-gray-800">Add a New Item</h2>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col">
        {/* Conditional Alert for Missing Categories */}
        {!hasCategories && (
          <div
            className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-800 p-4 mb-6 rounded-lg flex items-center space-x-3"
            role="alert"
          >
            <AlertTriangle className="w-6 h-6 flex-shrink-0" />
            <p className="font-semibold text-sm">
              You must **add a category** before you can add an item.
            </p>
          </div>
        )}

        {/* Input Fields Container */}
        <div className="overflow-y-auto px-2 py-2 space-y-6 max-h-[70vh]">
          <input
            type="text"
            value={itemName}
            onChange={(e) => setItemName(e.target.value)}
            placeholder="Item Name"
            required
            disabled={loading || !hasCategories} // Disabled if no categories
            className="w-full px-4 py-4 text-lg border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-700 focus:border-transparent transition-all font-sans disabled:bg-gray-50 disabled:cursor-not-allowed"
          />
          <input
            type="number"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            placeholder="Quantity"
            required
            disabled={loading || !hasCategories} // Disabled if no categories
            className="w-full px-4 py-4 text-lg border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-700 focus:border-transparent transition-all font-sans disabled:bg-gray-50 disabled:cursor-not-allowed"
          />

          {/* New Searchable Category Field */}
          <div className="relative">
            <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              value={categorySearchTerm}
              onChange={(e) => {
                setCategorySearchTerm(e.target.value);
                // Clear selected category if user starts typing
                if (category && category !== e.target.value) {
                  setCategory("");
                }
                setShowCategoryDropdown(true);
              }}
              onFocus={() => setShowCategoryDropdown(true)}
              onBlur={() =>
                setTimeout(() => setShowCategoryDropdown(false), 200)
              }
              placeholder="Search or Select Category"
              required
              disabled={loading || !hasCategories} // Disabled if no categories
              className={`w-full pl-12 pr-4 py-4 text-lg border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-700 focus:border-transparent transition-all font-sans disabled:bg-gray-50 disabled:cursor-not-allowed
              ${category ? "text-gray-800" : "text-gray-400"}`}
            />

            {showCategoryDropdown &&
              hasCategories &&
              filteredCategories.length > 0 && (
                <ul className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                  {filteredCategories.map((cat) => (
                    <li
                      key={cat.id}
                      onMouseDown={() => handleCategorySelection(cat.name)} // Use onMouseDown to prevent onBlur from firing first
                      className="px-4 py-3 cursor-pointer hover:bg-blue-50 text-gray-800 font-sans border-b border-gray-100 last:border-b-0"
                    >
                      {cat.name}
                    </li>
                  ))}
                </ul>
              )}
            {showCategoryDropdown &&
              categorySearchTerm &&
              filteredCategories.length === 0 && (
                <div className="px-4 py-3 text-sm text-red-500 bg-white border border-gray-300 rounded-lg shadow-lg mt-1">
                  No categories match "{categorySearchTerm}"
                </div>
              )}
          </div>
          {/* End Searchable Category Field */}

          <input
            type="number"
            value={buyingPrice}
            onChange={(e) => setBuyingPrice(e.target.value)}
            placeholder="Buying Price"
            required
            disabled={loading || !hasCategories} // Disabled if no categories
            className="w-full px-4 py-4 text-lg border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-700 focus:border-transparent transition-all font-sans disabled:bg-gray-50 disabled:cursor-not-allowed"
          />
          <input
            type="number"
            value={sellingPrice}
            onChange={(e) => setSellingPrice(e.target.value)}
            placeholder="Selling Price"
            required
            disabled={loading || !hasCategories} // Disabled if no categories
            className="w-full px-4 py-4 text-lg border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-700 focus:border-transparent transition-all font-sans disabled:bg-gray-50 disabled:cursor-not-allowed"
          />
        </div>
        {/* Form submission button */}
        <div className="mt-auto pt-6">
          <button
            type="submit"
            disabled={loading || !category || !hasCategories} // Disabled if no valid category is selected OR no categories exist
            className="w-full bg-blue-700 text-white font-bold py-4 rounded-lg hover:bg-blue-800 transition-colors duration-300 flex items-center justify-center font-sans disabled:bg-blue-300"
          >
            {loading ? (
              <Loader className="mr-2 animate-spin" />
            ) : (
              <ShoppingBag className="mr-2" />
            )}
            Add Item
          </button>
        </div>
      </form>
    </div>
  );
};

export default AddItem;
