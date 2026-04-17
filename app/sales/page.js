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
import SalesTable from "./_components/SalesTable";
import SalesSummary from "./_components/SalesSummary";
import PageLoader from "@/app/components/PageLoader";

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
    <div className="min-h-[90svh] w-full flex justify-center bg-gray-100 font-sans p-4 sm:p-6 lg:p-8">
      <div className="w-full max-w-7xl bg-white rounded-xl shadow-lg p-4 sm:p-6 lg:p-8">
        {" "}
        {/* Applied bg-white and padding here */}
        <div className="flex flex-col sm:flex-row justify-between items-center sm:items-center mb-6">
          <h1 className="text-2xl sm:text-3xl font-semibold text-gray-900 mb-4 sm:mb-0">
            Sales Records 📈
          </h1>
          <button
            onClick={() => {
              setEditingSale(null);
              setIsModalOpen(true);
            }}
            className="px-6 py-3 bg-blue-600 text-white rounded-xl shadow-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200"
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
                className={`px-2 py-2 text-sm font-medium rounded-xl transition-colors ${
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
        />
        {sales.length > itemsPerPage && (
          <nav className="mt-4 flex justify-center items-center space-x-4">
            <button
              onClick={goToPreviousPage}
              disabled={currentPage === 1}
              className="px-4 py-2 rounded-xl bg-gray-200 text-gray-700 hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            <div className="text-center text-sm font-medium text-gray-700">
              Page {currentPage} of {totalPages}
            </div>
            <button
              onClick={goToNextPage}
              disabled={currentPage === totalPages}
              className="px-4 py-2 rounded-xl bg-gray-200 text-gray-700 hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
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
