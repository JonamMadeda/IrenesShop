"use client";
import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  ShoppingBag,
  ArrowRight,
  UserCheck,
  XCircle,
  Trash2,
  CheckCircle,
  AlertCircle,
  Loader,
  List,
} from "lucide-react";
import { createClient } from "@/utils/supabase/client";
import { getShopContext } from "@/utils/supabase/getShopContext";
import ManageCategories from "./_components/ManageCategories";
import AddItem from "./_components/AddItem";
import PageLoader from "@/app/components/PageLoader";
import StocksTable from "./_components/StocksTable";

// ---------- Alert Modal ----------
const AlertModal = ({ show, title, message, onClose }) => {
  if (!show) return null;
  return (
    <div className="fixed inset-0 bg-white bg-opacity-30 backdrop-blur-md flex items-center justify-center p-4 z-50 font-sans">
      <div className="relative p-8 bg-white text-gray-900 w-full max-w-sm rounded-xl shadow-2xl">
        <div className="flex justify-center mb-4">
          <CheckCircle className="h-16 w-16 text-green-500" />
        </div>
        <h3 className="text-2xl font-bold text-center text-blue-700 mb-2 font-sans">
          {title}
        </h3>
        <p className="text-gray-600 text-center mb-6 font-sans">{message}</p>
        <button
          onClick={onClose}
          className="w-full bg-blue-700 text-white px-4 py-3 rounded-xl hover:bg-blue-800 transition-colors duration-200 font-bold font-sans"
        >
          Close
        </button>
      </div>
    </div>
  );
};

// ---------- Confirm Modal ----------
const ConfirmModal = ({ show, title, message, onConfirm, onCancel }) => {
  if (!show) return null;
  return (
    <div className="fixed inset-0 bg-gray-900 bg-opacity-50 flex items-center justify-center p-4 z-50 font-sans">
      <div className="bg-white p-8 rounded-2xl w-full max-w-md shadow-2xl text-center">
        <div className="flex justify-center mb-4 text-red-500">
          <AlertCircle className="h-12 w-12" />
        </div>
        <h3 className="text-2xl font-bold text-gray-800 mb-2 font-sans">
          {title}
        </h3>
        <p className="text-gray-600 mb-6 font-sans">{message}</p>
        <div className="flex justify-center space-x-4">
          <button
            onClick={onCancel}
            className="px-6 py-3 bg-gray-200 text-gray-700 rounded-xl hover:bg-gray-300 transition-colors font-semibold"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="px-6 py-3 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-colors font-bold"
          >
            Confirm
          </button>
        </div>
      </div>
    </div>
  );
};

// ---------- Modal Wrapper ----------
const Modal = ({ show, title, onClose, children }) => {
  if (!show) return null;
  return (
    <div className="fixed inset-0 bg-white bg-opacity-50 backdrop-blur-sm flex items-center justify-center p-4 z-50 font-sans">
      <div className="relative p-6 bg-white text-gray-900 w-full max-w-lg rounded-xl transform transition-all duration-300 scale-100 shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center pb-4 border-b-2 border-gray-200 mb-4 sticky top-0 bg-white z-10">
          <h3 className="text-3xl font-semibold text-blue-700 font-sans">
            {title}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-red-500 transition-colors"
          >
            <XCircle size={24} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
};

// ---------- Main App ----------
const App = () => {
  const supabase = createClient();
  const [modalState, setModalState] = useState({
    show: false,
    title: "",
    content: null,
  });
  const [alertState, setAlertState] = useState({
    show: false,
    title: "",
    message: "",
  });
  const [confirmModalState, setConfirmModalState] = useState({
    show: false,
    title: "",
    message: "",
    onConfirm: () => {},
  });
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null);
  const [userDisplayName, setUserDisplayName] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeletingAll, setIsDeletingAll] = useState(false);
  const [categories, setCategories] = useState([]);
  const [categoriesRefreshKey, setCategoriesRefreshKey] = useState(0);

  const refreshCategories = () => {
    setCategoriesRefreshKey((current) => current + 1);
  };

  // ---------- Auth + Subscription ----------
  useEffect(() => {
    let isMounted = true;

    const fetchCategories = async (currentUserId) => {
      const { data: categoriesData } = await supabase
        .from("categories")
        .select("*")
        .eq("user_id", currentUserId)
        .order("name");

      if (isMounted) {
        setCategories(categoriesData || []);
      }
    };

    const initAuth = async () => {
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      
      if (!currentUser) {
        window.location.href = "/auth";
        return;
      }

      if (!isMounted) return;
      setUser(currentUser);
      const { queryId } = await getShopContext(currentUser.id);
      currentUser.queryId = queryId;
      setUserDisplayName(
        currentUser.user_metadata.display_name || currentUser.email
      );

      // Fetch user role
      const { data: dbUser } = await supabase
        .from('users')
        .select('role')
        .eq('id', currentUser.id)
        .single();
      setRole(dbUser?.role || 'staff');

      await fetchCategories(currentUser.queryId);
      if (isMounted) {
        setIsLoading(false);
      }
    };

    initAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_OUT') {
        window.location.href = "/auth";
      }
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [supabase]);

  // ---------- Modal + Alerts ----------
  const openModal = (title, content) =>
    setModalState({ show: true, title, content });
  const closeModal = () =>
    setModalState({ show: false, title: "", content: null });
  const showAlert = (message, title) =>
    setAlertState({ show: true, title, message });
  const closeAlert = () =>
    setAlertState({ show: false, title: "", message: "" });
  const closeConfirmModal = () =>
    setConfirmModalState({
      show: false,
      title: "",
      message: "",
      onConfirm: () => {},
    });

  // ---------- Category & Item Handlers ----------
  const handleManageCategories = () => {
    openModal(
      "Manage Categories",
      <ManageCategories
        onDeleteCategory={handleDeleteCategory}
        onCategoriesChange={refreshCategories}
        showAlert={showAlert}
        supabase={supabase}
        userId={user.queryId || user.id}
      />
    );
  };

  const handleAddNewItem = () => {
    openModal(
      "Add New Item",
      <AddItem
        onClose={closeModal}
        showAlert={showAlert}
        categories={categories}
        supabase={supabase}
        userId={user.queryId || user.id}
        onItemAdded={refreshCategories}
      />
    );
  };

  const handleUpdateItem = async (id, data) => {
    try {
      const { error } = await supabase
        .from("items")
        .update({
          name: data.name,
          category: data.category,
          quantity: Number(data.quantity),
          cost: Number(data.buyingPrice),
          price: Number(data.sellingPrice),
        })
        .eq("id", id)
        .eq("user_id", user.queryId || user.id);
      
      if (error) throw error;
      showAlert("Item updated successfully!", "Success!");
    } catch (err) {
      console.error(err);
      showAlert("Error updating item.", "Error!");
    }
  };

  const handleDeleteCategory = (categoryId, categoryName) => {
    setConfirmModalState({
      show: true,
      title: "Confirm Deletion",
      message: `Are you sure that you want to carry out this operation? You are about to permanently delete the category "${categoryName}". This action is risky, and deleted category data cannot be recovered.`,
      onConfirm: async () => {
        const { error } = await supabase
          .from("categories")
          .delete()
          .eq("id", categoryId)
          .eq("user_id", user.queryId || user.id);
        
        if (error) {
          showAlert("Error deleting category.", "Error!");
        } else {
          showAlert(`Category "${categoryName}" deleted.`, "Success!");
        }
        closeConfirmModal();
      },
    });
  };

  const handleDeleteItem = (itemId, itemName) => {
    setConfirmModalState({
      show: true,
      title: "Confirm Deletion",
      message: `Are you sure that you want to carry out this operation? You are about to permanently delete the item "${itemName}". This action is risky, and deleted item data cannot be recovered.`,
      onConfirm: async () => {
        const { error } = await supabase
          .from("items")
          .delete()
          .eq("id", itemId)
          .eq("user_id", user.queryId || user.id);
        
        if (error) {
          showAlert("Error deleting item.", "Error!");
        } else {
          showAlert(`Item "${itemName}" deleted.`, "Success!");
        }
        closeConfirmModal();
      },
    });
  };

  const handleDeleteAllItems = () => {
    setConfirmModalState({
      show: true,
      title: "Confirm All Deletion",
      message: "Are you sure that you want to carry out this operation? You are about to permanently delete all inventory items. This is a high-risk action, and no deleted records will be recoverable.",
      onConfirm: async () => {
        setIsDeletingAll(true);
        const { error } = await supabase
          .from("items")
          .delete()
          .eq("user_id", user.queryId || user.id);
        
        if (error) {
          showAlert("Error deleting all items.", "Error!");
        } else {
          showAlert("All items deleted.", "Success!");
        }
        setIsDeletingAll(false);
        closeConfirmModal();
      },
    });
  };

  // ---------- Loading ----------
  if (isLoading) return <PageLoader />;

  if (!user) {
    return <PageLoader />;
  }

  // ---------- Main Dashboard ----------
  return (
    <div className="min-h-[90vh] bg-gray-50 flex flex-col items-center p-4 font-sans">
      <div className="bg-white p-6 rounded-xl w-full max-w-7xl shadow-2xl">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-blue-700">
            Inventory Manager
          </h1>
          <div className="flex items-center space-x-4">
            <p className="hidden sm:block text-gray-500">
              Welcome, {userDisplayName}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <button
            onClick={handleAddNewItem}
            className="bg-blue-700 text-white py-3 rounded-xl flex justify-center items-center"
          >
            <ShoppingBag className="mr-2" /> Add Item
          </button>
          
          {(role === 'admin' || role === 'shop_owner') && (
            <>
              <button
                onClick={handleManageCategories}
                className="border-2 border-blue-700 text-blue-700 py-3 rounded-xl flex justify-center items-center"
              >
                <List className="mr-2" /> Manage Categories
              </button>
              <button
                onClick={handleDeleteAllItems}
                disabled={isDeletingAll}
                className="bg-red-600 text-white py-3 rounded-xl flex justify-center items-center"
              >
                {isDeletingAll ? (
                  <Loader className="mr-2 animate-spin" />
                ) : (
                  <Trash2 className="mr-2" />
                )}{" "}
                Delete All Items
              </button>
            </>
          )}
        </div>

        {/* ✅ Stocks Table as external component */}
        <StocksTable
          user={user}
          role={role}
          onUpdate={handleUpdateItem}
          onDelete={handleDeleteItem}
          categories={categories}
        />

        {/* Modals */}
        <Modal
          show={modalState.show}
          title={modalState.title}
          onClose={closeModal}
        >
          {modalState.content}
        </Modal>
        <AlertModal
          show={alertState.show}
          title={alertState.title}
          message={alertState.message}
          onClose={closeAlert}
        />
        <ConfirmModal
          show={confirmModalState.show}
          title={confirmModalState.title}
          message={confirmModalState.message}
          onConfirm={confirmModalState.onConfirm}
          onCancel={closeConfirmModal}
        />
      </div>
    </div>
  );
};

export default App;
