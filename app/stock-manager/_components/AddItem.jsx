"use client";
import React, { useState } from "react";
import { ShoppingBag, Loader, Search, AlertTriangle } from "lucide-react"; // Added AlertTriangle
import { logSystemEvent } from "@/utils/logging/client";

const AddItem = ({ onClose, showAlert, categories, suppliers, supabase, userId, onItemAdded }) => {
  const [itemName, setItemName] = useState("");
  const [quantity, setQuantity] = useState("");
  const [category, setCategory] = useState("");
  const [unit, setUnit] = useState("");
  const [buyingPrice, setBuyingPrice] = useState("");
  const [sellingPrice, setSellingPrice] = useState("");
  const [description, setDescription] = useState("");
  const [sku, setSku] = useState("");
  const [barcode, setBarcode] = useState("");
  const [reorderLevel, setReorderLevel] = useState("50");
  const [supplierId, setSupplierId] = useState("");
  const [expiryDate, setExpiryDate] = useState("");
  const [loading, setLoading] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);

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
      const { data: createdItem, error } = await supabase.from("items").insert({
        name: itemName,
        quantity: Number(quantity),
        category,
        unit: unit || null,
        cost: Number(buyingPrice),
        price: Number(sellingPrice),
        description: description || null,
        sku: sku || null,
        barcode: barcode || null,
        reorder_level: Number(reorderLevel),
        supplier_id: supplierId || null,
        expiry_date: expiryDate || null,
        user_id: userId,
        created_at: new Date(),
      }).select().single();
      
      if (error) throw error;

      await logSystemEvent({
        supabase,
        shopId: userId,
        action: "create",
        entityType: "inventory_item",
        entityId: createdItem?.id,
        entityName: itemName,
        details: {
          quantity: Number(quantity),
          category,
          unit: unit || null,
          cost: Number(buyingPrice),
          price: Number(sellingPrice),
          description: description || null,
          sku: sku || null,
          barcode: barcode || null,
          reorder_level: Number(reorderLevel),
          supplier_id: supplierId || null,
          expiry_date: expiryDate || null,
        },
      });

      showAlert(`Item "${itemName}" added!`, "Success!");
      if (onItemAdded) onItemAdded();
      
      // Reset states
      setItemName("");
      setQuantity("");
      setCategory("");
      setUnit("");
      setBuyingPrice("");
      setSellingPrice("");
      setDescription("");
      setSku("");
      setBarcode("");
      setReorderLevel("50");
      setSupplierId("");
      setExpiryDate("");
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
        <div className="overflow-y-auto px-2 py-2 space-y-4 max-h-[75vh]">
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Basic Info</label>
            <input
              type="text"
              value={itemName}
              onChange={(e) => setItemName(e.target.value)}
              placeholder="Item Name (e.g. Sugar 1kg)"
              required
              disabled={loading || !hasCategories}
              className="w-full px-4 py-3 text-lg border-2 border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all font-sans"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <input
              type="number"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              placeholder="Qty in Stock"
              required
              min="0"
              disabled={loading || !hasCategories}
              className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600 font-sans"
            />
            <input
              type="text"
              value={unit}
              onChange={(e) => setUnit(e.target.value)}
              placeholder="Unit (pcs, kg)"
              disabled={loading || !hasCategories}
              className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600 font-sans"
            />
          </div>

          {/* Searchable Category Field */}
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

          <input
            type="text"
            value={unit}
            onChange={(e) => setUnit(e.target.value)}
            placeholder="Unit (e.g. pcs, kg, box)"
            disabled={loading || !hasCategories}
            className="w-full px-4 py-4 text-lg border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-700 focus:border-transparent transition-all font-sans disabled:bg-gray-50 disabled:cursor-not-allowed"
          />

          <div className="grid grid-cols-2 gap-4 pt-2">
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 pl-1">Buying Price</label>
              <input
                type="number"
                value={buyingPrice}
                onChange={(e) => setBuyingPrice(e.target.value)}
                placeholder="Buying"
                required
                step="0.01"
                min="0"
                disabled={loading || !hasCategories}
                className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600 font-sans"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 pl-1">Selling Price</label>
              <input
                type="number"
                value={sellingPrice}
                onChange={(e) => setSellingPrice(e.target.value)}
                placeholder="Selling"
                required
                step="0.01"
                min="0"
                disabled={loading || !hasCategories}
                className="w-full px-4 py-3 border-2 border-blue-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600 font-sans bg-blue-50/30"
              />
            </div>
          </div>

          <div className="pt-2">
            <button
              type="button"
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="text-sm font-semibold text-blue-600 hover:text-blue-800 transition-colors flex items-center"
            >
              {showAdvanced ? "- Hide More Options" : "+ Add More Details (Suppliers, Expiry, etc.)"}
            </button>
          </div>

          {showAdvanced && (
            <div className="space-y-6 pt-2 animate-in fade-in slide-in-from-top-2 duration-300">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Item Code (SKU)</label>
                  <input
                    type="text"
                    value={sku}
                    onChange={(e) => setSku(e.target.value)}
                    placeholder="Optional"
                    className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600 font-sans"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Barcode</label>
                  <input
                    type="text"
                    value={barcode}
                    onChange={(e) => setBarcode(e.target.value)}
                    placeholder="Scan if available"
                    className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600 font-sans"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Low Stock Threshold</label>
                  <input
                    type="number"
                    value={reorderLevel}
                    onChange={(e) => setReorderLevel(e.target.value)}
                    placeholder="Alert at..."
                    className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600 font-sans"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Preferred Supplier</label>
                  <select
                    value={supplierId}
                    onChange={(e) => setSupplierId(e.target.value)}
                    className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600 font-sans appearance-none bg-white"
                  >
                    <option value="">Select supplier</option>
                    {suppliers && suppliers.map(s => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Expiration Date</label>
                <input
                  type="date"
                  value={expiryDate}
                  onChange={(e) => setExpiryDate(e.target.value)}
                  className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600 font-sans"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Internal Notes</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Packaging details, shelf location..."
                  rows={2}
                  className="w-full resize-none px-4 py-3 border-2 border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600 font-sans"
                />
              </div>
            </div>
          )}
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
