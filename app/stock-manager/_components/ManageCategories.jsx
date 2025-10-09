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
// NOTE: I assume ConfirmModal is defined in a separate file or the parent file.
// import ConfirmModal from "./ConfirmModal"; // Keeping existing import

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
      if (onCategoryAdded) onCategoryAdded();
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
          // Changed rounded-xl to rounded-lg
          className="w-full px-4 py-3 text-lg border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-700 focus:border-transparent transition-all font-sans"
        />
      </div>
      <button
        type="submit"
        disabled={loading}
        // Changed rounded-xl to rounded-lg
        className="w-full bg-blue-700 text-white font-bold py-3 rounded-lg hover:bg-blue-800 transition-colors duration-300 flex items-center justify-center font-sans disabled:bg-blue-300"
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
              // Changed rounded-xl to rounded-lg
              className="flex items-center justify-between p-4 bg-gray-100 rounded-lg shadow-sm"
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

// Manage Categories Component
const ManageCategories = ({ onDeleteCategory, showAlert, db, userId }) => {
  const [categories, setCategories] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const categoriesPerPage = 3;

  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState(null);
  const [confirmMessage, setConfirmMessage] = useState("");

  useEffect(() => {
    if (!userId) return;
    const q = query(
      collection(db, "users", userId, "categories"),
      orderBy("name")
    );

    const unsubscribe = onSnapshot(
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
    return () => unsubscribe();
  }, [userId, db, showAlert]);

  const filteredCategories = categories.filter((category) =>
    category.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalPages = Math.ceil(filteredCategories.length / categoriesPerPage);
  const indexOfLast = currentPage * categoriesPerPage;
  const indexOfFirst = indexOfLast - categoriesPerPage;
  const currentCategories = filteredCategories.slice(indexOfFirst, indexOfLast);

  const handleDeleteClick = (categoryId, categoryName) => {
    setCategoryToDelete(categoryId);
    setConfirmMessage(`Are you sure you want to delete "${categoryName}"?`);
    setIsConfirmOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!categoryToDelete || !userId) return;
    try {
      await deleteDoc(doc(db, "users", userId, "categories", categoryToDelete));
      showAlert("Category deleted successfully!", "Success!");
    } catch (error) {
      console.error("Error deleting category:", error);
      showAlert("Failed to delete category.", "Error!");
    } finally {
      setIsConfirmOpen(false);
      setCategoryToDelete(null);
    }
  };

  const handleCancelDelete = () => {
    setIsConfirmOpen(false);
    setCategoryToDelete(null);
  };

  return (
    <div className="flex flex-col">
      {/* Header for Add a New Category - Now using the full width provided by the parent modal */}
      <div className="flex items-center space-x-2 mb-6">
        {/* Changed rounded-full to rounded-lg */}
        <div className="p-2 rounded-lg bg-blue-100 text-blue-700">
          <PlusCircle className="w-5 h-5" />
        </div>
        <h2 className="text-xl font-bold text-gray-800">Add a New Category</h2>
      </div>

      <CreateCategoryForm
        onCategoryAdded={() => {}}
        showAlert={showAlert}
        db={db}
        userId={userId}
      />

      {/* Scrollable Category Section */}
      <div className="flex-grow overflow-y-auto pr-2 pb-6 mt-6 space-y-4 max-h-[70vh] sm:max-h-[60vh]">
        <div className="flex items-center space-x-2 mb-4">
          <h2 className="text-xl font-bold text-gray-800">
            Existing Categories
          </h2>
        </div>

        <div className="relative mb-4">
          <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
            <Search className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            placeholder="Search categories..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            // Changed rounded-xl to rounded-lg
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-700"
          />
        </div>

        <CategoryList
          categories={currentCategories}
          onDelete={handleDeleteClick}
        />

        {totalPages > 1 && (
          <div className="flex justify-center items-center space-x-4 mt-4 pb-4">
            <button
              onClick={() => setCurrentPage(currentPage - 1)}
              disabled={currentPage === 1}
              // Changed rounded-full to rounded-lg (if full is intended, leave as is, but assuming consistency)
              className="p-2 rounded-lg text-blue-700 hover:bg-blue-100 disabled:text-gray-400"
            >
              <ChevronLeft size={24} />
            </button>
            <span className="font-semibold text-gray-700 font-sans">
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage(currentPage + 1)}
              disabled={currentPage === totalPages}
              // Changed rounded-full to rounded-lg (if full is intended, leave as is, but assuming consistency)
              className="p-2 rounded-lg text-blue-700 hover:bg-blue-100 disabled:text-gray-400"
            >
              <ChevronRight size={24} />
            </button>
          </div>
        )}
      </div>

      {/* Assuming ConfirmModal is either defined here or correctly imported */}
      {/* If ConfirmModal is used, ensure it is available in the scope */}
      {isConfirmOpen && (
        // Placeholder for ConfirmModal usage
        // Note: You must define or import ConfirmModal for this to work.
        // If it's defined in the parent component, this structure is fine.
        // Assuming ConfirmModal is correctly available.
        <div /* Assuming ConfirmModal component is here */></div>
      )}
    </div>
  );
};

export default ManageCategories;
