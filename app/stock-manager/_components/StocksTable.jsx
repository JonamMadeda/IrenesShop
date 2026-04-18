"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  Eye,
  Layers3,
  PackageCheck,
  Search,
  Wallet,
} from "lucide-react";

import { createClient } from "@/utils/supabase/client";
import PageLoader from "@/app/components/PageLoader";

const LOW_STOCK_THRESHOLD = 50;

const formatCurrency = (value) => {
  const numericValue = Number(value ?? 0);
  if (Number.isNaN(numericValue)) {
    return "KSh 0";
  }

  return `KSh ${numericValue.toLocaleString()}`;
};

const getStockStatus = (quantity, threshold = 50) => {
  if (quantity <= 0) {
    return {
      label: "Out of Stock",
      className: "border-red-200 bg-red-50 text-red-700",
    };
  }

  if (quantity <= threshold) {
    return {
      label: "Low Stock",
      className: "border-amber-200 bg-amber-50 text-amber-700",
    };
  }

  return {
    label: "In Stock",
    className: "border-emerald-200 bg-emerald-50 text-emerald-700",
  };
};

const MetricCard = ({ icon: Icon, label, value, tone = "blue" }) => {
  const tones = {
    blue: "bg-blue-50 text-blue-700 border-blue-100",
    emerald: "bg-emerald-50 text-emerald-700 border-emerald-100",
    amber: "bg-amber-50 text-amber-700 border-amber-100",
    slate: "bg-slate-50 text-slate-700 border-slate-100",
  };

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className={`inline-flex rounded-xl border p-3 ${tones[tone]}`}>
        <Icon size={18} />
      </div>
      <p className="mt-4 text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
        {label}
      </p>
      <p className="mt-2 text-2xl font-bold text-slate-900">{value}</p>
    </div>
  );
};

const StockStatusBadge = ({ quantity, threshold }) => {
  const status = getStockStatus(Number(quantity ?? 0), threshold);

  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-bold uppercase tracking-wider ${status.className}`}>
      {status.label}
    </span>
  );
};

const DetailRow = ({ label, value }) => (
  <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">{label}</p>
    <p className="mt-2 text-sm font-semibold text-slate-900">{value || "Not available"}</p>
  </div>
);

const DetailsModal = ({ item, suppliers, role, onClose }) => {
  if (!item) {
    return null;
  }

  const supplierName = suppliers?.find(s => s.id === item.supplier_id)?.name || "Not assigned";
  const stockValue = Number(item.quantity ?? 0) * Number(item.buyingPrice ?? 0);
  const revenuePotential = Number(item.quantity ?? 0) * Number(item.sellingPrice ?? 0);
  const grossMargin = Number(item.sellingPrice ?? 0) - Number(item.buyingPrice ?? 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm">
      <div className="w-full max-w-4xl rounded-3xl bg-white shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-start justify-between border-b border-slate-200 px-6 py-5 sticky top-0 bg-white z-10">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-blue-600">
              Inventory Details
            </p>
            <h3 className="mt-3 text-2xl font-bold text-slate-900">{item.name}</h3>
            <p className="mt-1 text-sm text-slate-500">
              {item.category || "Uncategorized"}{item.unit ? ` • ${item.unit}` : ""}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl px-4 py-2 text-sm font-semibold text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900"
          >
            Close
          </button>
        </div>

        <div className="px-6 py-6">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <DetailRow label="Current Quantity" value={`${item.quantity}${item.unit ? ` ${item.unit}` : ""}`} />
            <DetailRow label="Stock Status" value={getStockStatus(item.quantity, item.reorder_level).label} />
            <DetailRow label="Item Code" value={item.sku} />
            <DetailRow label="Barcode" value={item.barcode} />
            <DetailRow label="Supplier" value={supplierName} />
            <DetailRow label="Expiry Date" value={item.expiry_date} />
            
            {(role === 'admin' || role === 'shop_owner') && (
              <>
                <DetailRow label="Buying Price" value={formatCurrency(item.buyingPrice)} />
                <DetailRow label="Selling Price" value={formatCurrency(item.sellingPrice)} />
                <DetailRow label="Stock Cost Value" value={formatCurrency(stockValue)} />
                <DetailRow label="Potential Revenue" value={formatCurrency(revenuePotential)} />
                <DetailRow label="Profit Margin" value={formatCurrency(grossMargin)} />
                <DetailRow label="Low Stock Alert at" value={`${item.reorder_level || 50} units`} />
              </>
            )}
            {!(role === 'admin' || role === 'shop_owner') && (
              <DetailRow label="Selling Price" value={formatCurrency(item.sellingPrice)} />
            )}
          </div>

          <div className="mt-6 rounded-2xl border border-slate-100 bg-slate-50 p-5">
            <p className="text-sm font-semibold text-slate-900 mb-2">Internal Notes</p>
            <p className="text-sm leading-6 text-slate-600 italic">
              {item.description || "No notes provided."}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

const EditModal = ({ item, categories, suppliers, onChange, onClose, onSave, isSaving }) => {
  const [showAdvanced, setShowAdvanced] = useState(false);

  if (!item) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/30 p-4 backdrop-blur-sm">
      <div className="w-full max-w-3xl rounded-2xl bg-white p-8 shadow-xl max-h-[90vh] overflow-y-auto">
        <h3 className="text-2xl font-bold text-slate-900">Edit Inventory Item</h3>
        <p className="mt-2 text-sm text-slate-500">
          Update the key stock details and logistics for Irene&apos;s Shop.
        </p>

        <form
          onSubmit={onSave}
          className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2"
        >
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-slate-700">Item Name</label>
            <input
              type="text"
              value={item.name}
              onChange={(event) => onChange("name", event.target.value)}
              className="mt-1 block w-full rounded-xl border border-slate-300 px-4 py-3 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
            />
          </div>

          <div className="md:col-span-2 grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700">Category</label>
              <select
                value={item.category}
                onChange={(event) => onChange("category", event.target.value)}
                className="mt-1 block w-full rounded-xl border border-slate-300 px-4 py-3 focus:border-blue-500 focus:outline-none"
              >
                {categories.map((category) => (
                  <option key={category.id} value={category.name}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700">Unit</label>
              <input
                type="text"
                value={item.unit || ""}
                onChange={(event) => onChange("unit", event.target.value)}
                placeholder="e.g. box, pcs"
                className="mt-1 block w-full rounded-xl border border-slate-300 px-4 py-3 focus:border-blue-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700">Quantity</label>
              <input
                type="number"
                min="0"
                value={item.quantity}
                onChange={(event) => onChange("quantity", Number(event.target.value))}
                className="mt-1 block w-full rounded-xl border border-slate-300 px-4 py-3 focus:border-blue-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700">Buy Price</label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={item.buyingPrice}
                onChange={(event) => onChange("buyingPrice", Number(event.target.value))}
                className="mt-1 block w-full rounded-xl border border-slate-300 px-4 py-3 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 font-bold text-blue-700">Sell Price</label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={item.sellingPrice}
                onChange={(event) => onChange("sellingPrice", Number(event.target.value))}
                className="mt-1 block w-full rounded-xl border border-blue-200 bg-blue-50/20 px-4 py-3 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </div>
          </div>

          <div className="md:col-span-2 pt-2">
            <button
              type="button"
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="text-sm font-bold text-blue-600 hover:text-blue-800 transition-colors"
            >
              {showAdvanced ? "- Hide More Options" : "+ Edit Details (Code, Barcode, Supplier, Expiry)"}
            </button>
          </div>

          {showAdvanced && (
            <div className="md:col-span-2 grid grid-cols-1 gap-4 md:grid-cols-2 pt-4 border-t border-slate-100 animate-in fade-in slide-in-from-top-2 duration-300">
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Item Code</label>
                <input
                  type="text"
                  value={item.sku || ""}
                  onChange={(event) => onChange("sku", event.target.value)}
                  className="block w-full rounded-xl border border-slate-300 px-4 py-3 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Barcode</label>
                <input
                  type="text"
                  value={item.barcode || ""}
                  onChange={(event) => onChange("barcode", event.target.value)}
                  className="block w-full rounded-xl border border-slate-300 px-4 py-3 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Reorder Alert At</label>
                <input
                  type="number"
                  min="0"
                  value={item.reorder_level || 50}
                  onChange={(event) => onChange("reorder_level", Number(event.target.value))}
                  className="block w-full rounded-xl border border-slate-300 px-4 py-3 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Supplier</label>
                <select
                  value={item.supplier_id || ""}
                  onChange={(event) => onChange("supplier_id", event.target.value)}
                  className="block w-full rounded-xl border border-slate-300 px-4 py-3 focus:border-blue-500 appearance-none bg-white font-sans"
                >
                  <option value="">No Supplier</option>
                  {suppliers?.map((s) => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Expiry Date</label>
                <input
                  type="date"
                  value={item.expiry_date || ""}
                  onChange={(event) => onChange("expiry_date", event.target.value)}
                  className="block w-full rounded-xl border border-slate-300 px-4 py-3 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Internal Notes</label>
                <textarea
                  rows={2}
                  value={item.description || ""}
                  onChange={(event) => onChange("description", event.target.value)}
                  className="block w-full resize-none rounded-xl border border-slate-300 px-4 py-3 focus:border-blue-500"
                />
              </div>
            </div>
          )}

          <div className="md:col-span-2 flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl bg-slate-100 px-5 py-3 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-blue-700 disabled:bg-blue-300"
            >
              {isSaving ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const DeleteModal = ({ item, onCancel, onConfirm, isDeleting }) => {
  if (!item) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/30 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 text-center shadow-xl">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-red-50 text-red-600">
          <AlertTriangle size={24} />
        </div>
        <h3 className="mt-5 text-xl font-bold text-slate-900">Confirm Deletion</h3>
        <p className="mt-3 text-sm leading-6 text-slate-600">
          Are you sure that you want to carry out this operation? You are about to permanently delete{" "}
          <span className="font-semibold">{item.name}</span>. This is a high-risk action, and the deleted record cannot be recovered.
        </p>
        <div className="mt-6 flex justify-center gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-xl bg-slate-100 px-5 py-3 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-200"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isDeleting}
            className="rounded-xl bg-red-600 px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-red-700 disabled:bg-red-300"
          >
            {isDeleting ? "Deleting..." : "Confirm Deletion"}
          </button>
        </div>
      </div>
    </div>
  );
};

const StocksTable = ({ user, categories, suppliers, role, onUpdate, onDelete }) => {
  const supabase = createClient();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedItem, setSelectedItem] = useState(null);
  const [editingItem, setEditingItem] = useState(null);
  const [deletingItem, setDeletingItem] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const itemsPerPage = 10;

  useEffect(() => {
    if (!user) return;

    const fetchItems = async () => {
      setLoading(true);
      const { data, error: fetchError } = await supabase
        .from("items")
        .select("*")
        .eq("user_id", user.queryId || user.id)
        .order("name");

      if (fetchError) {
        console.error("Error fetching items:", fetchError);
        setError("Failed to fetch inventory items.");
      } else {
        setItems(
          (data || []).map((item) => ({
            ...item,
            quantity: Number(item.quantity ?? 0),
            buyingPrice: Number(item.cost ?? item.buyingPrice ?? 0),
            sellingPrice: Number(item.price ?? item.sellingPrice ?? 0),
            reorder_level: Number(item.reorder_level ?? 50),
          }))
        );
        setError(null);
      }
      setLoading(false);
    };

    fetchItems();

    const channel = supabase
      .channel("items_changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "items", filter: `user_id=eq.${user.queryId || user.id}` },
        () => fetchItems()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, supabase]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedCategory, selectedStatus]);

  const inventoryMetrics = useMemo(() => {
    const totalUnits = items.reduce((sum, item) => sum + Number(item.quantity ?? 0), 0);
    const stockCost = items.reduce(
      (sum, item) => sum + (Number(item.quantity ?? 0) * Number(item.buyingPrice ?? 0)),
      0
    );
    const projectedRevenue = items.reduce(
      (sum, item) => sum + (Number(item.quantity ?? 0) * Number(item.sellingPrice ?? 0)),
      0
    );
    const outOfStockCount = items.filter((item) => Number(item.quantity ?? 0) <= 0).length;
    const lowStockCount = items.filter(
      (item) => {
        const qty = Number(item.quantity ?? 0);
        return qty > 0 && qty <= (item.reorder_level || 50);
      }
    ).length;

    return {
      totalSkus: items.length,
      totalUnits,
      stockCost,
      projectedRevenue,
      lowStockCount,
      outOfStockCount,
    };
  }, [items]);

  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      const matchesCategory =
        selectedCategory === "all" || item.category === selectedCategory;
      const matchesSearch =
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.description || "").toLowerCase().includes(searchQuery.toLowerCase());

      const quantity = Number(item.quantity ?? 0);
      const threshold = item.reorder_level || 50;
      const matchesStatus =
        selectedStatus === "all" ||
        (selectedStatus === "in_stock" && quantity > threshold) ||
        (selectedStatus === "low_stock" && quantity > 0 && quantity <= threshold) ||
        (selectedStatus === "out_of_stock" && quantity <= 0);

      return matchesCategory && matchesSearch && matchesStatus;
    });
  }, [items, searchQuery, selectedCategory, selectedStatus]);

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredItems.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredItems.length / itemsPerPage);

  const handleFieldChange = (field, value) => {
    setEditingItem((current) => ({
      ...current,
      [field]: value,
    }));
  };

  const handleUpdateSubmit = async (event) => {
    event.preventDefault();
    if (!editingItem || !onUpdate) return;

    setIsSubmitting(true);
    try {
      await onUpdate(editingItem.id, editingItem);
      setEditingItem(null);
    } catch (updateError) {
      console.error("Error updating item:", updateError);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deletingItem || !onDelete) return;

    setIsSubmitting(true);
    try {
      await onDelete(deletingItem.id, deletingItem.name);
      setDeletingItem(null);
    } catch (deleteError) {
      console.error("Error deleting item:", deleteError);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-lg">
      <div className="mb-6 flex flex-col gap-4">
        <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
          <div>
            <h2 className="text-2xl font-bold text-slate-900">Inventory Overview</h2>
            <p className="mt-1 text-sm text-slate-500">
              Monitor current stock levels, identify low-stock items early, and keep item records clean.
            </p>
          </div>
          <div className="inline-flex rounded-full bg-slate-100 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
            Per-Item Reorder Intelligence Active
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <MetricCard icon={Layers3} label="Active SKUs" value={inventoryMetrics.totalSkus} tone="blue" />
          <MetricCard icon={PackageCheck} label="Units On Hand" value={inventoryMetrics.totalUnits} tone="emerald" />
          {(role === 'admin' || role === 'shop_owner') && (
            <>
              <MetricCard icon={Wallet} label="Stock Cost" value={formatCurrency(inventoryMetrics.stockCost)} tone="slate" />
              <MetricCard icon={AlertTriangle} label="Low / Out" value={`${inventoryMetrics.lowStockCount} / ${inventoryMetrics.outOfStockCount}`} tone="amber" />
            </>
          )}
        </div>
      </div>

      <div className="mb-6 flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
        <div className="grid w-full gap-4 md:grid-cols-3 xl:max-w-4xl">
          <div className="relative">
            <Search
              size={18}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              type="text"
              placeholder="Search by item name or note..."
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              className="w-full rounded-xl border border-slate-300 px-4 py-3 pl-10 text-sm text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
            />
          </div>

          <select
            value={selectedCategory}
            onChange={(event) => setSelectedCategory(event.target.value)}
            className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
          >
            <option value="all">All Categories</option>
            {categories.map((category) => (
              <option key={category.id} value={category.name}>
                {category.name}
              </option>
            ))}
          </select>

          <select
            value={selectedStatus}
            onChange={(event) => setSelectedStatus(event.target.value)}
            className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
          >
            <option value="all">All Stock Status</option>
            <option value="in_stock">In Stock</option>
            <option value="low_stock">Low Stock</option>
            <option value="out_of_stock">Out of Stock</option>
          </select>
        </div>

        {(role === 'admin' || role === 'shop_owner') && (
          <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-600">
            Projected revenue value: <span className="font-bold text-slate-900">{formatCurrency(inventoryMetrics.projectedRevenue)}</span>
          </div>
        )}
      </div>

      {loading ? (
        <PageLoader />
      ) : error ? (
        <div className="py-10 text-center text-sm text-red-600">{error}</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Item
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Category
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                  On Hand
                </th>
                {(role === 'admin' || role === 'shop_owner') && (
                  <>
                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                      Buy
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                      Sell
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                      Margin
                    </th>
                  </>
                )}
                {!(role === 'admin' || role === 'shop_owner') && (
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Selling Price
                  </th>
                )}
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {currentItems.length > 0 ? (
                currentItems.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/80">
                    <td className="px-6 py-4">
                      <p className="text-sm font-semibold text-slate-900">{item.name}</p>
                      <p className="mt-1 text-xs text-slate-500">
                        {item.description ? item.description.slice(0, 70) : "No item description"}
                      </p>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600">
                      {item.category || "Uncategorized"}
                    </td>
                    <td className="px-6 py-4">
                      <StockStatusBadge quantity={item.quantity} threshold={item.reorder_level} />
                    </td>
                    <td className="px-6 py-4 text-sm font-semibold text-slate-900">
                      {item.quantity}{item.unit ? ` ${item.unit}` : ""}
                    </td>
                    {(role === 'admin' || role === 'shop_owner') && (
                      <>
                        <td className="px-6 py-4 text-sm text-slate-600">
                          {formatCurrency(item.buyingPrice)}
                        </td>
                        <td className="px-6 py-4 text-sm text-slate-600">
                          {formatCurrency(item.sellingPrice)}
                        </td>
                        <td className="px-6 py-4 text-sm font-semibold text-emerald-700">
                          {formatCurrency(Number(item.sellingPrice ?? 0) - Number(item.buyingPrice ?? 0))}
                        </td>
                      </>
                    )}
                    {!(role === 'admin' || role === 'shop_owner') && (
                      <td className="px-6 py-4 text-sm text-slate-600">
                        {formatCurrency(item.sellingPrice)}
                      </td>
                    )}
                    <td className="px-6 py-4 text-sm font-medium">
                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          onClick={() => setSelectedItem(item)}
                          className="text-slate-600 transition-colors hover:text-slate-900"
                        >
                          View
                        </button>
                        {(role === "admin" || role === "shop_owner") && (
                          <button
                            type="button"
                            onClick={() => setEditingItem(item)}
                            className="text-blue-600 transition-colors hover:text-blue-900"
                          >
                            Edit
                          </button>
                        )}
                        {(role === "admin" || role === "shop_owner") && (
                          <button
                            type="button"
                            onClick={() => setDeletingItem(item)}
                            className="text-red-600 transition-colors hover:text-red-900"
                          >
                            Delete
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="8" className="px-6 py-10 text-center text-sm text-slate-500">
                    No inventory items match the current filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {filteredItems.length > itemsPerPage && (
        <nav className="mt-5 flex items-center justify-center gap-4">
          <button
            type="button"
            onClick={() => setCurrentPage((current) => current - 1)}
            disabled={currentPage === 1}
            className="rounded-xl bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-200 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <span className="inline-flex items-center gap-2">
              <ChevronLeft size={16} />
              Previous
            </span>
          </button>
          <div className="text-sm font-medium text-slate-600">
            Page {currentPage} of {totalPages}
          </div>
          <button
            type="button"
            onClick={() => setCurrentPage((current) => current + 1)}
            disabled={currentPage === totalPages}
            className="rounded-xl bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-200 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <span className="inline-flex items-center gap-2">
              Next
              <ChevronRight size={16} />
            </span>
          </button>
        </nav>
      )}

      <DetailsModal item={selectedItem} suppliers={suppliers} role={role} onClose={() => setSelectedItem(null)} />

      <EditModal
        item={editingItem}
        categories={categories}
        suppliers={suppliers}
        onChange={handleFieldChange}
        onClose={() => setEditingItem(null)}
        onSave={handleUpdateSubmit}
        isSaving={isSubmitting}
      />

      <DeleteModal
        item={deletingItem}
        onCancel={() => setDeletingItem(null)}
        onConfirm={handleDeleteConfirm}
        isDeleting={isSubmitting}
      />
    </div>
  );
};

export default StocksTable;
