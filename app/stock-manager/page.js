"use client";
import React, { useState, useEffect } from "react";
import {
  ShoppingBag,
  XCircle,
  Trash2,
  CheckCircle,
  AlertCircle,
  Loader,
  List,
  Contact,
} from "lucide-react";
import { createClient } from "@/utils/supabase/client";
import { getShopContext } from "@/utils/supabase/getShopContext";
import ManageCategories from "./_components/ManageCategories";
import ManageSuppliers from "./_components/ManageSuppliers";
import AddItem from "./_components/AddItem";
import PageLoader from "@/app/components/PageLoader";
import StocksTable from "./_components/StocksTable";
import { logSystemEvent } from "@/utils/logging/client";

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
  const [suppliers, setSuppliers] = useState([]);
  const [categoriesRefreshKey, setCategoriesRefreshKey] = useState(0);

  const refreshRegistry = () => {
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

    const fetchSuppliers = async (currentUserId) => {
      const { data: suppliersData } = await supabase
        .from("suppliers")
        .select("*")
        .eq("user_id", currentUserId)
        .order("name");

      if (isMounted) {
        setSuppliers(suppliersData || []);
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
      await fetchSuppliers(currentUser.queryId);
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
        onCategoriesChange={refreshRegistry}
        showAlert={showAlert}
        supabase={supabase}
        userId={user.queryId || user.id}
      />
    );
  };

  const handleManageSuppliers = () => {
    openModal(
      "Suppliers",
      <ManageSuppliers
        onSuppliersChange={refreshRegistry}
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
        suppliers={suppliers}
        supabase={supabase}
        userId={user.queryId || user.id}
        onItemAdded={refreshRegistry}
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
          unit: data.unit || null,
          cost: Number(data.buyingPrice),
          price: Number(data.sellingPrice),
          description: data.description || null,
          sku: data.sku || null,
          barcode: data.barcode || null,
          reorder_level: Number(data.reorder_level || 50),
          supplier_id: data.supplier_id || null,
          expiry_date: data.expiry_date || null,
        })
        .eq("id", id)
        .eq("user_id", user.queryId || user.id);
      
      if (error) throw error;

      await logSystemEvent({
        supabase,
        shopId: user.queryId || user.id,
        action: "update",
        entityType: "inventory_item",
        entityId: id,
        entityName: data.name,
        details: {
          quantity: Number(data.quantity),
          category: data.category,
          unit: data.unit || null,
          cost: Number(data.buyingPrice),
          price: Number(data.sellingPrice),
          description: data.description || null,
          sku: data.sku || null,
          barcode: data.barcode || null,
          reorder_level: Number(data.reorder_level || 50),
          supplier_id: data.supplier_id || null,
          expiry_date: data.expiry_date || null,
        },
        actorRole: role,
      });

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
          await logSystemEvent({
            supabase,
            shopId: user.queryId || user.id,
            action: "delete",
            entityType: "inventory_item",
            entityId: itemId,
            entityName: itemName,
            details: {
              deleted_item_id: itemId,
            },
            actorRole: role,
          });
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
          await logSystemEvent({
            supabase,
            shopId: user.queryId || user.id,
            action: "delete",
            entityType: "inventory_batch",
            entityName: "All Inventory Items",
            details: {
              scope: "all_items_for_shop",
            },
            actorRole: role,
          });
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
        <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-blue-600">
              Stock Workspace
            </p>
            <h1 className="mt-2 text-3xl font-bold text-slate-900">
              Inventory Manager
            </h1>
            <p className="mt-2 text-sm text-slate-500">
              Keep stock records accurate, review inventory health, and update item details used by Irene&apos;s Shop.
            </p>
          </div>
          <div className="flex items-center space-x-4">
            <p className="hidden rounded-full bg-slate-100 px-4 py-2 text-sm font-medium text-slate-600 sm:block">
              Signed in as {userDisplayName}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
          {(role === 'admin' || role === 'shop_owner') && (
            <>
              <button
                onClick={handleAddNewItem}
                className="bg-blue-700 text-white py-4 rounded-2xl flex justify-center items-center font-bold shadow-lg shadow-blue-900/10 hover:bg-blue-800 transition-all hover:scale-[1.02] active:scale-95"
              >
                <ShoppingBag className="mr-2" size={18} /> Add New Item
              </button>
              
              <button
                onClick={handleManageCategories}
                className="border border-slate-200 bg-white text-slate-700 py-4 rounded-2xl flex justify-center items-center font-semibold hover:bg-slate-50 transition-all"
              >
                <List className="mr-2 text-blue-600" size={18} /> Inventory Categories
              </button>

              <button
                onClick={handleManageSuppliers}
                className="border border-slate-200 bg-white text-slate-700 py-4 rounded-2xl flex justify-center items-center font-semibold hover:bg-slate-50 transition-all"
              >
                <Contact className="mr-2 text-blue-600" size={18} /> Wholesaler Directory
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
          suppliers={suppliers}
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
        {/* Danger Zone - Safely tucked away at the bottom */}
        {(role === 'admin' || role === 'shop_owner') && (
          <div className="mt-12 border-t border-slate-100 pt-10">
            <div className="rounded-2xl bg-red-50/50 border border-red-100 p-6 flex flex-col md:flex-row items-center justify-between gap-4">
              <div>
                <h4 className="text-sm font-bold text-red-900 uppercase tracking-wider text-left">System Maintenance</h4>
                <p className="text-xs text-red-600 mt-1 font-medium text-left">Clear all inventory records. This action is permanent and restricted to shop owners.</p>
              </div>
              <button
                onClick={handleDeleteAllItems}
                disabled={isDeletingAll}
                className="bg-white border border-red-200 text-red-600 px-6 py-3 rounded-xl flex items-center text-xs font-bold uppercase tracking-widest hover:bg-red-600 hover:text-white transition-all disabled:opacity-50"
              >
                {isDeletingAll ? (
                  <Loader className="mr-2 animate-spin" size={14} />
                ) : (
                  <Trash2 className="mr-2" size={14} />
                )}
                Clear Entire Inventory
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default App;
