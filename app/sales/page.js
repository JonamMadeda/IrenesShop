"use client";

import React, { useState, useEffect } from "react";
import {
  format,
  startOfDay,
  endOfDay,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  startOfYear,
  endOfYear,
} from "date-fns";
import { createClient } from "@/utils/supabase/client";
import { getShopContext } from "@/utils/supabase/getShopContext";
import {
  ChevronLeft,
  ChevronRight,
  Pencil,
  Trash2,
  CheckCircle,
} from "lucide-react";
import RecordSaleModal from "./_components/RecordSaleModal";
import ConfirmModal from "./_components/ConfirmModal";
import SaleDetailsModal from "./_components/SaleDetailsModal";
import SalesTable from "./_components/SalesTable";
import SalesSummary from "./_components/SalesSummary";
import PageLoader from "@/app/components/PageLoader";
import { logSystemEvent } from "@/utils/logging/client";

// appId and initialAuthToken logic removed for Supabase migration

// Helper function to safely extract a numeric value
const getNumericValue = (value) => {
  const parsedValue = parseFloat(value);
  return isNaN(parsedValue) ? 0 : parsedValue;
};

// Helper function to get the date range based on period
const getDateRange = (period, customDate) => {
  const date = customDate || new Date();
  switch (period) {
    case "daily":
      return { start: startOfDay(date), end: endOfDay(date) };
    case "weekly":
      return { start: startOfWeek(date), end: endOfWeek(date) };
    case "monthly":
      return { start: startOfMonth(date), end: endOfMonth(date) };
    case "yearly":
      return { start: startOfYear(date), end: endOfYear(date) };
    default:
      return { start: startOfDay(date), end: endOfDay(date) };
  }
};

const SalesPage = () => {
  const supabase = createClient();
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [userId, setUserId] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSale, setEditingSale] = useState(null);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [confirmAction, setConfirmAction] = useState(null);
  const [confirmMessage, setConfirmMessage] = useState("");
  const [selectedSale, setSelectedSale] = useState(null);
  const [period, setPeriod] = useState("monthly"); // Default period
  const [currentDate, setCurrentDate] = useState(new Date());

  // New state for success message
  const [successMessage, setSuccessMessage] = useState(null);
  const [refreshTick, setRefreshTick] = useState(0);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const refreshSales = () => {
    setRefreshTick((current) => current + 1);
  };

  // Authentication Effect
  useEffect(() => {
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { queryId } = await getShopContext(user.id);
        setUserId(queryId);
      } else {
        window.location.href = "/auth";
      }
    };
    checkUser();
  }, [supabase]);

  // Fetch Sales Data Effect with date filtering
  useEffect(() => {
    if (!userId) return;

    const fetchSales = async () => {
      setLoading(true);
      const { start, end } = getDateRange(period, currentDate);

      const { data, error } = await supabase
        .from("sales")
        .select("*")
        .eq("user_id", userId)
        .gte("sale_date", start.toISOString())
        .lte("sale_date", end.toISOString())
        .order("sale_date", { ascending: false });

      if (error) {
        console.error("Error fetching sales: ", error);
        setError("Failed to fetch sales. Please try again later.");
      } else {
        setSales(data.map(item => ({
          ...item,
          itemId: item.item_id || item.itemId,
          saleDate: new Date(item.sale_date || item.saleDate), 
          itemName: item.item_name || item.itemName,
          itemCategory: item.item_category || item.itemCategory,
          totalRevenue: item.total_revenue || item.totalRevenue,
          totalCost: item.total_cost || item.totalCost,
          profit: item.profit,
          remainingQuantity: item.remaining_quantity ?? item.remainingQuantity,
          recordedByUserId: item.recorded_by_user_id ?? item.recordedByUserId,
          recordedByName: item.recorded_by_name ?? item.recordedByName,
          recordedByEmail: item.recorded_by_email ?? item.recordedByEmail,
          recordedByRole: item.recorded_by_role ?? item.recordedByRole,
        })));
      }
      setLoading(false);
    };

    fetchSales();

    const channel = supabase
      .channel('sales_changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'sales', filter: `user_id=eq.${userId}` },
        () => fetchSales()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, period, currentDate, supabase, refreshTick]);

  // Handle period change
  const handlePeriodChange = (newPeriod) => {
    setPeriod(newPeriod);
    setCurrentPage(1); // Reset page on period change
  };

  // Handle date navigation
  const navigateDate = (direction) => {
    const newDate = new Date(currentDate);
    if (direction === "prev") {
      if (period === "daily") newDate.setDate(newDate.getDate() - 1);
      else if (period === "weekly") newDate.setDate(newDate.getDate() - 7);
      else if (period === "monthly") newDate.setMonth(newDate.getMonth() - 1);
      else if (period === "yearly")
        newDate.setFullYear(newDate.getFullYear() - 1);
    } else {
      if (period === "daily") newDate.setDate(newDate.getDate() + 1);
      else if (period === "weekly") newDate.setDate(newDate.getDate() + 7);
      else if (period === "monthly") newDate.setMonth(newDate.getMonth() + 1);
      else if (period === "yearly")
        newDate.setFullYear(newDate.getFullYear() + 1);
    }
    setCurrentDate(newDate);
    setCurrentPage(1); // Reset page on date navigation
  };

  // Handle date change from the input
  const handleDateChange = (event) => {
    const newDate = new Date(event.target.value);
    setCurrentDate(newDate);
    setPeriod("daily"); // Force to daily period when a specific date is picked
    setCurrentPage(1); // Reset page on date change
  };

  // Calculate summary statistics
  const totalSalesRecords = sales.length;
  const totalRevenue = sales.reduce(
    (sum, sale) => sum + getNumericValue(sale.totalRevenue),
    0
  );
  const totalCost = sales.reduce(
    (sum, sale) => sum + getNumericValue(sale.totalCost),
    0
  );
  const totalProfit = totalRevenue - totalCost;
  const totalItemsSold = sales.reduce(
    (sum, sale) => sum + getNumericValue(sale.quantity),
    0
  );

  // Pagination calculations
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentSales = sales.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(sales.length / itemsPerPage);

  const paginate = (pageNumber) => setCurrentPage(pageNumber);
  const goToNextPage = () => setCurrentPage((prev) => prev + 1);
  const goToPreviousPage = () => setCurrentPage((prev) => prev - 1);

  const handleEdit = (sale) => {
    setEditingSale(sale);
    setIsModalOpen(true);
  };

  const handleViewDetails = (sale) => {
    setSelectedSale(sale);
  };

  const handleDeleteClick = (saleId) => {
    if (!userId) return;
    setConfirmMessage(
      "Are you sure that you want to carry out this operation? You are about to permanently delete this sale record. This is a high-risk action, and deleted data cannot be recovered."
    );
    setConfirmAction(() => () => handleDelete(saleId));
    setIsConfirmOpen(true);
  };

  const handleDelete = async (saleId) => {
    try {
      const { error } = await supabase
        .from("sales")
        .delete()
        .eq("id", saleId)
        .eq("user_id", userId);
      
      if (error) throw error;

      await logSystemEvent({
        supabase,
        shopId: userId,
        action: "delete",
        entityType: "sale_record",
        entityId: saleId,
        entityName: "Sale Record",
        details: {
          deleted_sale_id: saleId,
        },
      });

      setSuccessMessage("Sale record deleted successfully!");
      setTimeout(() => {
        setSuccessMessage(null);
      }, 3000);
    } catch (err) {
      console.error("Error deleting sale:", err);
    } finally {
      setIsConfirmOpen(false);
      setConfirmAction(null);
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingSale(null);
  };

  const handleCloseConfirmModal = () => {
    setIsConfirmOpen(false);
    setConfirmAction(null);
  };

  const handleCloseDetails = () => {
    setSelectedSale(null);
  };

  if (loading) {
    return <PageLoader />;
  }

  if (error) {
    return (
      <div className="flex justify-center items-center h-screen bg-gray-100">
        <p className="text-red-600 font-medium">{error}</p>
      </div>
    );
  }

  return (
    <div className="min-h-[90svh] bg-gray-50 flex flex-col items-center p-4 font-sans">
      <div className="bg-white p-6 rounded-xl w-full max-w-7xl shadow-2xl">
        <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-blue-600">
              Sales Workspace
            </p>
            <h1 className="mt-2 text-3xl font-bold text-slate-900">
              Sales Records
            </h1>
            <p className="mt-2 text-sm text-slate-500">
              Track daily transactions, monitor revenue and profit performance, and manage your shop&apos;s sales history.
            </p>
          </div>
          <button
            onClick={() => {
              setEditingSale(null);
              setIsModalOpen(true);
            }}
            className="px-6 py-3 bg-blue-700 text-white rounded-xl shadow-md hover:bg-blue-800 transition-colors duration-200 font-semibold"
          >
            Record New Sale
          </button>
        </div>

        {/* Period Selector & Date Navigation */}
        <div className="bg-white p-4 rounded-2xl shadow-lg border border-gray-100 mb-8 flex flex-col sm:flex-row items-center sm:items-center justify-between relative z-40">
          <div className="flex items-center space-x-4">
            <label
              htmlFor="date-input"
              className="text-sm font-medium text-gray-700"
            >
              Select a Date:
            </label>
            <input
              type="date"
              id="date-input"
              value={format(currentDate, "yyyy-MM-dd")}
              onChange={handleDateChange}
              className="px-4 py-2 border rounded-xl text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors duration-200"
            />
          </div>
          <div className="flex flex-wrap gap-1 sm:gap-2 mt-4 sm:mt-0">
            {["daily", "weekly", "monthly", "yearly"].map((p) => (
              <button
                key={p}
                onClick={() => handlePeriodChange(p)}
                className={`px-4 py-2 text-sm font-medium rounded-xl transition-colors ${
                  period === p
                    ? "bg-blue-600 text-white shadow-md"
                    : "text-gray-600 bg-gray-50 hover:bg-gray-100"
                }`}
              >
                {p.charAt(0).toUpperCase() + p.slice(1)}
              </button>
            ))}
          </div>
        </div>

        <SalesSummary
          totalSalesRecords={totalSalesRecords}
          totalRevenue={totalRevenue}
          totalProfit={totalProfit}
          totalItemsSold={totalItemsSold}
        />

        <SalesTable
          sales={currentSales}
          loading={loading}
          error={error}
          onEdit={handleEdit}
          onDeleteClick={handleDeleteClick}
          onViewDetails={handleViewDetails}
        />

        {sales.length > itemsPerPage && (
          <nav className="mt-6 flex justify-center items-center space-x-4">
            <button
              onClick={goToPreviousPage}
              disabled={currentPage === 1}
              className="px-4 py-2 rounded-xl bg-gray-200 text-gray-700 hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
            >
              Previous
            </button>
            <div className="text-center text-sm font-medium text-gray-700">
              Page {currentPage} of {totalPages}
            </div>
            <button
              onClick={goToNextPage}
              disabled={currentPage === totalPages}
              className="px-4 py-2 rounded-xl bg-gray-200 text-gray-700 hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
            >
              Next
            </button>
          </nav>
        )}

        {isModalOpen && (
          <RecordSaleModal
            isOpen={isModalOpen}
            onClose={handleCloseModal}
            userId={userId}
            supabase={supabase}
            initialData={editingSale}
            onSaleSaved={refreshSales}
          />
        )}
        {isConfirmOpen && (
          <ConfirmModal
            message={confirmMessage}
            onConfirm={confirmAction}
            onCancel={handleCloseConfirmModal}
          />
        )}
        {selectedSale && (
          <SaleDetailsModal sale={selectedSale} onClose={handleCloseDetails} />
        )}

        {/* Success Notification */}
        {successMessage && (
          <div className="fixed bottom-4 right-4 z-50">
            <div className="flex items-center gap-2 p-4 bg-green-500 text-white rounded-xl shadow-lg">
              <CheckCircle size={20} />
              <span className="font-medium">{successMessage}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SalesPage;
