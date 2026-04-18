"use client";
import React, { useState, useEffect } from "react";
import {
  PlusCircle,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Search,
  Loader,
  UserPlus,
  Phone,
  Mail,
  MapPin,
} from "lucide-react";
import { logSystemEvent } from "@/utils/logging/client";

const CreateSupplierForm = ({ onSupplierAdded, showAlert, supabase, userId }) => {
  const [formData, setFormData] = useState({
    name: "",
    contact_person: "",
    phone: "",
    email: "",
    address: "",
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!userId) {
      showAlert("User not authenticated. Please try again.", "Error!");
      return;
    }
    setLoading(true);
    try {
      const { data: newSupplier, error } = await supabase
        .from("suppliers")
        .insert({
          ...formData,
          user_id: userId,
          created_at: new Date(),
        })
        .select()
        .single();
      
      if (error) throw error;

      await logSystemEvent({
        supabase,
        shopId: userId,
        action: "create",
        entityType: "supplier",
        entityId: newSupplier?.id,
        entityName: formData.name,
        details: formData,
      });

      showAlert(`Supplier "${formData.name}" added!`, "Success!");
      setFormData({ name: "", contact_person: "", phone: "", email: "", address: "" });
      if (onSupplierAdded) onSupplierAdded(newSupplier);
    } catch (err) {
      console.error(err);
      showAlert("Error creating supplier", "Error!");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 pt-4 border-b border-gray-100 pb-8 mb-8">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <input
          type="text"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          placeholder="Wholesaler / Company Name *"
          required
          disabled={loading}
          className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-700 font-sans"
        />
        <input
          type="text"
          value={formData.contact_person}
          onChange={(e) => setFormData({ ...formData, contact_person: e.target.value })}
          placeholder="Contact Person"
          disabled={loading}
          className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-700 font-sans"
        />
        <div className="relative">
          <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="tel"
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            placeholder="Phone Number"
            disabled={loading}
            className="w-full pl-10 pr-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-700 font-sans"
          />
        </div>
        <div className="relative">
          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            placeholder="Email Address"
            disabled={loading}
            className="w-full pl-10 pr-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-700 font-sans"
          />
        </div>
        <div className="md:col-span-2 relative">
          <MapPin className="absolute left-3 top-4 h-5 w-5 text-gray-400" />
          <textarea
            value={formData.address}
            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
            placeholder="Supplier Address / Location"
            rows={2}
            disabled={loading}
            className="w-full pl-10 pr-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-700 font-sans"
          />
        </div>
      </div>
      <button
        type="submit"
        disabled={loading}
        className="w-full bg-blue-700 text-white font-bold py-3 rounded-lg hover:bg-blue-800 transition-colors duration-300 flex items-center justify-center font-sans disabled:bg-blue-300"
      >
        {loading ? (
          <Loader className="mr-2 animate-spin" />
        ) : (
          <UserPlus className="mr-2" />
        )}
        Add Supplier
      </button>
    </form>
  );
};

const SupplierList = ({ suppliers, onDelete }) => {
  return (
    <div className="space-y-4">
      {suppliers.length === 0 ? (
        <p className="text-gray-500 text-center py-8 font-sans">
          No suppliers found in your directory.
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {suppliers.map((supplier) => (
            <div
              key={supplier.id}
              className="p-5 bg-slate-50 border border-slate-200 rounded-xl shadow-sm hover:shadow-md transition-shadow group"
            >
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-lg font-bold text-slate-900 group-hover:text-blue-700 transition-colors">
                    {supplier.name}
                  </h3>
                  {supplier.contact_person && (
                    <p className="text-sm font-medium text-slate-500 mt-1">
                      {supplier.contact_person}
                    </p>
                  )}
                </div>
                <button
                  onClick={() => onDelete(supplier.id, supplier.name)}
                  className="p-2 text-slate-400 hover:text-red-500 transition-colors rounded-lg hover:bg-red-50"
                  aria-label={`Delete ${supplier.name}`}
                >
                  <Trash2 size={18} />
                </button>
              </div>
              <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm text-slate-600">
                {supplier.phone && (
                  <div className="flex items-center gap-2">
                    <Phone size={14} className="text-slate-400" />
                    <span>{supplier.phone}</span>
                  </div>
                )}
                {supplier.email && (
                  <div className="flex items-center gap-2">
                    <Mail size={14} className="text-slate-400" />
                    <span className="truncate">{supplier.email}</span>
                  </div>
                )}
                {supplier.address && (
                  <div className="flex items-center gap-2 sm:col-span-2">
                    <MapPin size={14} className="text-slate-400" />
                    <span className="truncate">{supplier.address}</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const ManageSuppliers = ({ onSuppliersChange, showAlert, supabase, userId }) => {
  const [suppliers, setSuppliers] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const suppliersPerPage = 4;

  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [supplierToDelete, setSupplierToDelete] = useState(null);
  const [confirmMessage, setConfirmMessage] = useState("");

  useEffect(() => {
    if (!userId) return;

    const fetchSuppliers = async () => {
      const { data, error } = await supabase
        .from("suppliers")
        .select("*")
        .eq("user_id", userId)
        .order("name");
      
      if (error) {
        console.error("Error fetching suppliers: ", error);
        showAlert("Failed to load suppliers.", "Error!");
      } else {
        setSuppliers(data || []);
      }
    };

    fetchSuppliers();

    const channel = supabase
      .channel('suppliers_changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'suppliers', filter: `user_id=eq.${userId}` },
        () => fetchSuppliers()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, supabase, showAlert]);

  const filteredSuppliers = suppliers.filter((s) =>
    s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (s.contact_person || "").toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSupplierAdded = (newSupplier) => {
    if (newSupplier) {
      setSuppliers((current) =>
        [...current, newSupplier].sort((a, b) => a.name.localeCompare(b.name))
      );
    }
    if (onSuppliersChange) onSuppliersChange();
  };

  const totalPages = Math.ceil(filteredSuppliers.length / suppliersPerPage);
  const indexOfLast = currentPage * suppliersPerPage;
  const indexOfFirst = indexOfLast - suppliersPerPage;
  const currentSuppliers = filteredSuppliers.slice(indexOfFirst, indexOfLast);

  const handleDeleteClick = (id, name) => {
    setSupplierToDelete(id);
    setConfirmMessage(
      `Are you sure you want to delete "${name}"? This will untie this supplier from any existing products, but products will not be deleted.`
    );
    setIsConfirmOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!supplierToDelete || !userId) return;
    try {
      const { error } = await supabase
        .from("suppliers")
        .delete()
        .eq("id", supplierToDelete)
        .eq("user_id", userId);
      
      if (error) throw error;

      await logSystemEvent({
        supabase,
        shopId: userId,
        action: "delete",
        entityType: "supplier",
        entityId: supplierToDelete,
        entityName: suppliers.find((s) => s.id === supplierToDelete)?.name || "Supplier",
        details: { deleted_id: supplierToDelete },
      });

      showAlert("Supplier removed.", "Success!");
      if (onSuppliersChange) onSuppliersChange();
    } catch (error) {
      console.error("Error deleting supplier:", error);
      showAlert("Failed to delete supplier.", "Error!");
    } finally {
      setIsConfirmOpen(false);
      setSupplierToDelete(null);
    }
  };

  return (
    <div className="flex flex-col">
      <div className="flex items-center space-x-2 mb-4">
        <div className="p-2 rounded-lg bg-blue-100 text-blue-700">
          <PlusCircle className="w-5 h-5" />
        </div>
        <h2 className="text-xl font-bold text-gray-800">New Wholesaler / Supplier</h2>
      </div>

      <CreateSupplierForm
        onSupplierAdded={handleSupplierAdded}
        showAlert={showAlert}
        supabase={supabase}
        userId={userId}
      />

      <div className="flex-grow overflow-y-auto pr-2 pb-6 space-y-4 max-h-[70vh] sm:max-h-[60vh]">
        <div className="flex items-center space-x-2 mb-4">
          <h2 className="text-xl font-bold text-gray-800">Supplier Directory</h2>
        </div>

        <div className="relative mb-6">
          <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
            <Search className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            placeholder="Search by company or contact..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-700 lg:text-sm"
          />
        </div>

        <SupplierList
          suppliers={currentSuppliers}
          onDelete={handleDeleteClick}
        />

        {totalPages > 1 && (
          <div className="flex justify-center items-center space-x-4 mt-6">
            <button
              onClick={() => setCurrentPage(currentPage - 1)}
              disabled={currentPage === 1}
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
              className="p-2 rounded-lg text-blue-700 hover:bg-blue-100 disabled:text-gray-400"
            >
              <ChevronRight size={24} />
            </button>
          </div>
        )}
      </div>

      {isConfirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-2xl">
            <h3 className="text-xl font-bold text-slate-900">Confirm Action</h3>
            <p className="mt-3 text-gray-600 leading-relaxed">{confirmMessage}</p>
            <div className="mt-8 flex gap-3">
              <button
                type="button"
                onClick={() => setIsConfirmOpen(false)}
                className="flex-1 rounded-xl border border-slate-200 px-4 py-3 text-sm font-bold text-slate-700 transition-colors hover:bg-slate-50"
              >
                Go Back
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="flex-1 rounded-xl bg-red-600 px-4 py-3 text-sm font-bold text-white transition-colors hover:bg-red-700"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManageSuppliers;
