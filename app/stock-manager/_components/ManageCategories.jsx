"use client";
import React, { useState, useEffect } from "react";
import {
  PlusCircle,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Search,
  Loader,
} from "lucide-react";
import {
  collection,
  addDoc,
  serverTimestamp,
  deleteDoc,
  doc,
  query,
  orderBy,
  onSnapshot,
} from "firebase/firestore";

// Create Category Form
const CreateCategoryForm = ({ onCategoryAdded, showAlert, db, userId }) => {
  const [categoryName, setCategoryName] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!userId) {
      showAlert("User not authenticated. Please try again.", "Error!");
      return;
    }
    setLoading(true);
    try {
      await addDoc(collection(db, "users", userId, "categories"), {
        name: categoryName,
        createdAt: serverTimestamp(),
      });
      showAlert(`Category "${categoryName}" created!`, "Success!");
      setCategoryName("");
      if (onCategoryAdded) {
        onCategoryAdded();
      }
    } catch (err) {
      console.error(err);
      showAlert("Error creating category", "Error!");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 pt-4">
      <div className="relative">
        <input
          type="text"
          value={categoryName}
          onChange={(e) => setCategoryName(e.target.value)}
          placeholder="Category Name"
          required
          disabled={loading}
          className="w-full px-4 py-3 text-lg border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-700 focus:border-transparent transition-all font-sans"
        />
      </div>
      <button
        type="submit"
        disabled={loading}
        className="w-full bg-blue-700 text-white font-bold py-3 rounded-xl hover:bg-blue-800 transition-colors duration-300 flex items-center justify-center font-sans disabled:bg-blue-300"
      >
        {loading ? (
          <Loader className="mr-2 animate-spin" />
        ) : (
          <PlusCircle className="mr-2" />
        )}
        Create
      </button>
    </form>
  );
};

// Category List Component
const CategoryList = ({ categories, onDelete }) => {
  return (
    <div className="space-y-4">
      {categories.length === 0 ? (
        <p className="text-gray-500 text-center font-sans">
          No categories found.
        </p>
      ) : (
        <ul className="space-y-4">
          {categories.map((category) => (
            <li
              key={category.id}
              className="flex items-center justify-between p-4 bg-gray-100 rounded-xl shadow-sm"
            >
              <span className="text-lg font-semibold text-gray-800 font-sans">
                {category.name}
              </span>
              <button
                onClick={() => onDelete(category.id, category.name)}
                className="text-red-500 hover:text-red-700 transition-colors"
                aria-label={`Delete category ${category.name}`}
              >
                <Trash2 size={20} />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

// Consolidated Manage Categories Component
const ManageCategories = ({ onDeleteCategory, showAlert, db, userId }) => {
  const [categories, setCategories] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const categoriesPerPage = 3;

  useEffect(() => {
    if (!userId) {
      return;
    }
    const categoriesCollectionRef = collection(
      db,
      "users",
      userId,
      "categories"
    );
    const q = query(categoriesCollectionRef, orderBy("name"));

    const unsubscribeCategories = onSnapshot(
      q,
      (snapshot) => {
        const categoriesData = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setCategories(categoriesData);
      },
      (error) => {
        console.error("Error fetching categories: ", error);
        showAlert("Failed to load categories.", "Error!");
      }
    );
    return () => unsubscribeCategories();
  }, [userId, db, showAlert]);

  const filteredCategories = categories.filter((category) =>
    category.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalPages = Math.ceil(filteredCategories.length / categoriesPerPage);
  const indexOfLastCategory = currentPage * categoriesPerPage;
  const indexOfFirstCategory = indexOfLastCategory - categoriesPerPage;
  const currentCategories = filteredCategories.slice(
    indexOfFirstCategory,
    indexOfLastCategory
  );

  const handlePageChange = (pageNumber) => {
    if (pageNumber >= 1 && pageNumber <= totalPages) {
      setCurrentPage(pageNumber);
    }
  };

  useEffect(() => {
    setCurrentPage(1); // Reset to first page on search query change
  }, [searchQuery]);

  const handleCategoryAdded = () => {
    // The onSnapshot listener already handles real-time updates, so this might not be strictly necessary
    // but is kept for clarity.
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b pb-4">
        <h4 className="text-xl font-bold text-gray-800 font-sans mb-2 sm:mb-0">
          Add New Category
        </h4>
        <CreateCategoryForm
          onCategoryAdded={handleCategoryAdded}
          showAlert={showAlert}
          db={db}
          userId={userId}
        />
      </div>
      <div className="space-y-4">
        <h4 className="text-xl font-bold text-gray-800 font-sans">
          Existing Categories
        </h4>
        <div className="relative mb-4">
          <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
            <Search className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            placeholder="Search categories..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-700"
          />
        </div>
        <CategoryList
          categories={currentCategories}
          onDelete={onDeleteCategory}
        />
        {totalPages > 1 && (
          <div className="flex justify-center items-center space-x-4 mt-4">
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className="p-2 rounded-full text-blue-700 hover:bg-blue-100 disabled:text-gray-400"
            >
              <ChevronLeft size={24} />
            </button>
            <span className="font-semibold text-gray-700 font-sans">
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="p-2 rounded-full text-blue-700 hover:bg-blue-100 disabled:text-gray-400"
            >
              <ChevronRight size={24} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ManageCategories;
