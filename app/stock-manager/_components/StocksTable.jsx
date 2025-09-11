"use client";
import React, { useState, useEffect } from "react";
import { Search, ChevronLeft, ChevronRight } from "lucide-react";
import {
  collection,
  onSnapshot,
  doc,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
} from "firebase/firestore";
import { db } from "@/firebase/firebase.client";
import PageLoader from "@/app/components/PageLoader";

const StocksTable = ({ user, categories }) => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);
  const [currentItemToEdit, setCurrentItemToEdit] = useState(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);
  const [isActionInProgress, setIsActionInProgress] = useState(false);
  const [successMessage, setSuccessMessage] = useState(null);

  useEffect(() => {
    if (!user) return;

    const itemsCollectionRef = collection(db, "users", user.uid, "items");
    const q = query(itemsCollectionRef, orderBy("name"));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const fetchedItems = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setItems(fetchedItems);
        setLoading(false);
      },
      (err) => {
        console.error("Error fetching items:", err);
        setError("Failed to fetch inventory items.");
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [user]);

  // Handle success message visibility
  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => {
        setSuccessMessage(null);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  // 🔎 Filter by category + search
  const filteredItems = items.filter((item) => {
    const matchesCategory =
      selectedCategory === "all" || item.category === selectedCategory;
    const matchesSearch = item.name
      .toLowerCase()
      .includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  // Reset pagination on filter change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedCategory]);

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredItems.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredItems.length / itemsPerPage);

  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  const onUpdate = (item) => {
    setCurrentItemToEdit(item);
    setIsUpdateModalOpen(true);
  };

  const handleUpdateSubmit = async (e) => {
    e.preventDefault();
    if (!db || !user || !currentItemToEdit) return;

    const { id, ...updatedItem } = currentItemToEdit;
    setIsUpdateModalOpen(false);
    setIsActionInProgress(true);

    try {
      const itemDocRef = doc(db, "users", user.uid, "items", id);
      await updateDoc(itemDocRef, updatedItem);
      setCurrentItemToEdit(null);
      setSuccessMessage("Item updated successfully!");
    } catch (err) {
      console.error("Error updating item:", err);
      // Implement a user-facing error message here
    } finally {
      setIsActionInProgress(false);
    }
  };

  const onUpdateModalClose = () => {
    setIsUpdateModalOpen(false);
    setCurrentItemToEdit(null);
  };

  const onDelete = (item) => {
    setItemToDelete(item);
    setIsDeleteModalOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!db || !user || !itemToDelete) return;

    setIsDeleteModalOpen(false);
    setIsActionInProgress(true);

    try {
      const itemDocRef = doc(db, "users", user.uid, "items", itemToDelete.id);
      await deleteDoc(itemDocRef);
      setItemToDelete(null);
      setSuccessMessage("Item deleted successfully!");
    } catch (err) {
      console.error("Error deleting item:", err);
      // Implement a user-facing error message here
    } finally {
      setIsActionInProgress(false);
    }
  };

  const handleDeleteModalClose = () => {
    setIsDeleteModalOpen(false);
    setItemToDelete(null);
  };

  return (
    <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden p-6 font-sans">
      {/* Header Row */}
      <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-6 gap-4">
        {/* Title */}
        <h2 className="text-xl font-bold text-gray-800">Inventory Items</h2>
        {/* Filters Row */}
        <div className="flex flex-col md:flex-row md:items-center gap-4 w-full md:w-auto">
          {/* Search Box */}
          <div className="relative w-full md:w-64">
            <input
              type="text"
              placeholder="Search items..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-4 py-2 border rounded-xl pl-10 focus:outline-none focus:ring-2 focus:ring-blue-500 font-sans"
            />
            <Search
              size={20}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            />
          </div>
          {/* Category Filter */}
          <div className="w-full md:w-64">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full px-4 py-2 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 font-sans"
            >
              <option value="all">All Categories</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.name}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>
      {/* Table */}
      {loading || isActionInProgress ? (
        <PageLoader />
      ) : error ? (
        <div className="text-center py-8 text-gray-500">{error}</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Item Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Category
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Quantity
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Buying Price
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Selling Price
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {currentItems.length > 0 ? (
                currentItems.map((item) => (
                  <tr key={item.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {item.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {item.category}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {item.quantity}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      KSh {item.buyingPrice}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      KSh {item.sellingPrice}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => onUpdate(item)}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => onDelete(item)}
                          className="text-red-600 hover:text-red-900"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="text-center py-8 text-gray-500">
                    No items found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
      {/* Pagination */}
      {filteredItems.length > itemsPerPage && (
        <nav className="flex justify-center items-center space-x-4 mt-4">
          <button
            onClick={() => paginate(currentPage - 1)}
            disabled={currentPage === 1}
            className="px-4 py-2 rounded-xl bg-gray-200 text-gray-700 hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Previous
          </button>
          <div className="text-center text-sm font-medium text-gray-700">
            Page {currentPage} of {totalPages}
          </div>
          <button
            onClick={() => paginate(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="px-4 py-2 rounded-xl bg-gray-200 text-gray-700 hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Next
          </button>
        </nav>
      )}

      {/* Update Modal */}
      {isUpdateModalOpen && currentItemToEdit && (
        <div className="fixed inset-0 bg-white/30 backdrop-blur-sm overflow-y-auto h-full w-full flex items-center justify-center font-sans">
          <div className="relative bg-white rounded-lg shadow-xl p-8 w-full max-w-lg mx-4">
            <h3 className="text-2xl font-bold mb-4">Edit Item</h3>
            <form onSubmit={handleUpdateSubmit}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="col-span-1 md:col-span-2">
                  <label
                    htmlFor="name"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Name
                  </label>
                  <input
                    id="name"
                    type="text"
                    value={currentItemToEdit.name}
                    onChange={(e) =>
                      setCurrentItemToEdit({
                        ...currentItemToEdit,
                        name: e.target.value,
                      })
                    }
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 font-sans px-3 py-2 border rounded-xl"
                  />
                </div>
                <div>
                  <label
                    htmlFor="category"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Category
                  </label>
                  <select
                    id="category"
                    value={currentItemToEdit.category}
                    onChange={(e) =>
                      setCurrentItemToEdit({
                        ...currentItemToEdit,
                        category: e.target.value,
                      })
                    }
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 font-sans px-3 py-2 border rounded-xl"
                  >
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.name}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label
                    htmlFor="quantity"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Quantity
                  </label>
                  <input
                    id="quantity"
                    type="number"
                    value={currentItemToEdit.quantity}
                    onChange={(e) =>
                      setCurrentItemToEdit({
                        ...currentItemToEdit,
                        quantity: Number(e.target.value),
                      })
                    }
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 font-sans px-3 py-2 border rounded-xl"
                  />
                </div>
                <div>
                  <label
                    htmlFor="buyingPrice"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Buying Price
                  </label>
                  <input
                    id="buyingPrice"
                    type="number"
                    step="0.01"
                    value={currentItemToEdit.buyingPrice}
                    onChange={(e) =>
                      setCurrentItemToEdit({
                        ...currentItemToEdit,
                        buyingPrice: Number(e.target.value),
                      })
                    }
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 font-sans px-3 py-2 border rounded-xl"
                  />
                </div>
                <div>
                  <label
                    htmlFor="sellingPrice"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Selling Price
                  </label>
                  <input
                    id="sellingPrice"
                    type="number"
                    step="0.01"
                    value={currentItemToEdit.sellingPrice}
                    onChange={(e) =>
                      setCurrentItemToEdit({
                        ...currentItemToEdit,
                        sellingPrice: Number(e.target.value),
                      })
                    }
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 font-sans px-3 py-2 border rounded-xl"
                  />
                </div>
              </div>
              <div className="mt-6 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={onUpdateModalClose}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-xl hover:bg-gray-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-xl hover:bg-blue-700"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {isDeleteModalOpen && itemToDelete && (
        <div className="fixed inset-0 bg-white/30 backdrop-blur-sm overflow-y-auto h-full w-full flex items-center justify-center font-sans">
          <div className="relative bg-white rounded-lg shadow-xl p-8 w-full max-w-sm mx-4 text-center">
            <h3 className="text-xl font-bold mb-4">Confirm Deletion</h3>
            <p className="text-gray-700 mb-6">
              Are you sure you want to delete{" "}
              <span className="font-semibold">{itemToDelete.name}</span>? This
              action cannot be undone.
            </p>
            <div className="flex justify-center gap-4">
              <button
                type="button"
                onClick={handleDeleteModalClose}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-xl hover:bg-gray-300"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteConfirm}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-xl hover:bg-red-700"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Success Message Pop-up */}
      {successMessage && (
        <div className="fixed bottom-4 right-4 z-50">
          <div className="bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg flex items-center space-x-2 font-sans">
            <span>{successMessage}</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default StocksTable;
