"use client";
import React, { useState } from "react";
import { ShoppingBag, Loader } from "lucide-react";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";

const AddItem = ({ onClose, showAlert, categories, db, userId }) => {
  const [itemName, setItemName] = useState("");
  const [quantity, setQuantity] = useState("");
  const [category, setCategory] = useState("");
  const [buyingPrice, setBuyingPrice] = useState("");
  const [sellingPrice, setSellingPrice] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!userId) {
      showAlert("User not authenticated. Please try again.", "Error!");
      return;
    }
    setLoading(true);
    try {
      await addDoc(collection(db, "users", userId, "items"), {
        name: itemName,
        quantity: Number(quantity),
        category,
        buyingPrice: Number(buyingPrice),
        sellingPrice: Number(sellingPrice),
        createdAt: serverTimestamp(),
      });
      showAlert(`Item "${itemName}" added!`, "Success!");
      setItemName("");
      setQuantity("");
      setCategory("");
      setBuyingPrice("");
      setSellingPrice("");
      onClose();
    } catch (err) {
      console.error(err);
      showAlert("Error adding item", "Error!");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full h-full bg-white p-6 rounded-xl shadow-md flex flex-col">
      {/* Header */}
      <div className="flex items-center space-x-2 mb-6">
        <div className="p-2 rounded-full bg-blue-100 text-blue-700">
          <ShoppingBag className="w-5 h-5" />
        </div>
        <h2 className="text-xl font-bold text-gray-800">Add a New Item</h2>
      </div>

      <form onSubmit={handleSubmit} className="h-full flex flex-col">
        <div className="flex-grow overflow-y-auto pr-4 pb-6 space-y-6">
          <input
            type="text"
            value={itemName}
            onChange={(e) => setItemName(e.target.value)}
            placeholder="Item Name"
            required
            disabled={loading}
            className="w-full px-4 py-4 text-lg border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-700 focus:border-transparent transition-all font-sans"
          />
          <input
            type="number"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            placeholder="Quantity"
            required
            disabled={loading}
            className="w-full px-4 py-4 text-lg border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-700 focus:border-transparent transition-all font-sans"
          />
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            required
            disabled={loading}
            className="w-full px-4 py-4 text-lg border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-700 focus:border-transparent transition-all font-sans bg-white"
          >
            <option value="" disabled>
              Select Category
            </option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.name}>
                {cat.name}
              </option>
            ))}
          </select>
          <input
            type="number"
            value={buyingPrice}
            onChange={(e) => setBuyingPrice(e.target.value)}
            placeholder="Buying Price"
            required
            disabled={loading}
            className="w-full px-4 py-4 text-lg border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-700 focus:border-transparent transition-all font-sans"
          />
          <input
            type="number"
            value={sellingPrice}
            onChange={(e) => setSellingPrice(e.target.value)}
            placeholder="Selling Price"
            required
            disabled={loading}
            className="w-full px-4 py-4 text-lg border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-700 focus:border-transparent transition-all font-sans"
          />
        </div>
        <div className="mt-auto pt-6">
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-700 text-white font-bold py-4 rounded-xl hover:bg-blue-800 transition-colors duration-300 flex items-center justify-center font-sans disabled:bg-blue-300"
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
