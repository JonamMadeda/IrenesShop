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
import {
  collection,
  query,
  onSnapshot,
  doc,
  deleteDoc,
  where,
  orderBy,
} from "firebase/firestore";
import { signInWithCustomToken, signInAnonymously } from "firebase/auth";
import { ChevronLeft, ChevronRight, Pencil, Trash2 } from "lucide-react";
import RecordSaleModal from "./_components/RecordSaleModal";
import ConfirmModal from "./_components/ConfirmModal";
import SalesTable from "./_components/SalesTable";
import SalesSummary from "./_components/SalesSummary";
import PageLoader from "@/app/components/PageLoader";
import { db, auth } from "@/firebase/firebase.client.js";

// The __firebase_config and __initial_auth_token are provided globally by the Canvas environment.
const initialAuthToken =
  typeof __initial_auth_token !== "undefined" ? __initial_auth_token : null;
const appId = typeof __app_id !== "undefined" ? __app_id : "default-app-id";

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

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Define Firebase collection paths
  // This makes the path configurable and easier to manage in one place.
  const salesCollectionPath = `users/${userId}/sales`;

  // Authentication Effect
  useEffect(() => {
    const unsubscribeAuth = auth.onAuthStateChanged(async (user) => {
      if (!user) {
        try {
          if (initialAuthToken) {
            await signInWithCustomToken(auth, initialAuthToken);
          } else {
            await signInAnonymously(auth);
          }
        } catch (err) {
          console.error("Authentication failed:", err);
          setError("Authentication failed. Please refresh the page.");
        }
      }
      if (auth.currentUser) {
        setUserId(auth.currentUser.uid);
      }
    });
    return () => unsubscribeAuth();
  }, []);

  // Fetch Sales Data Effect with date filtering
  useEffect(() => {
    if (!userId) return;

    setLoading(true);
    setError(null);

    const { start, end } = getDateRange(period, currentDate);

    const salesCollectionRef = collection(db, salesCollectionPath);
    const q = query(
      salesCollectionRef,
      where("saleDate", ">=", start),
      where("saleDate", "<=", end),
      orderBy("saleDate", "desc")
    );

    const unsubscribeSnapshot = onSnapshot(
      q,
      (snapshot) => {
        const salesData = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
          saleDate: doc.data().saleDate?.toDate(),
        }));
        setSales(salesData);
        setLoading(false);
      },
      (err) => {
        console.error("Error fetching sales: ", err);
        setError("Failed to fetch sales. Please try again later.");
        setLoading(false);
      }
    );
    return () => unsubscribeSnapshot();
  }, [userId, period, currentDate, salesCollectionPath]);

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
    setConfirmMessage("Are you sure you want to delete this sale record?");
    setConfirmAction(() => () => handleDelete(saleId));
    setIsConfirmOpen(true);
  };

  const handleDelete = async (saleId) => {
    try {
      await deleteDoc(doc(db, salesCollectionPath, saleId));
    } catch (err) {
      console.error("Error deleting sale:", err);
      // We can't show alert, so we'll just log it
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

  const pageNumbers = [];
  if (sales.length > itemsPerPage) {
    for (let i = 1; i <= totalPages; i++) {
      pageNumbers.push(i);
    }
  }

  return (
    <div className="min-h-[90svh] w-full flex justify-center bg-gray-100 font-sans p-4 sm:p-6 lg:p-8">
      <div className="w-full max-w-7xl">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-4 sm:mb-0">
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
        <div className="bg-white p-4 rounded-2xl shadow-lg border border-gray-100 mb-8 flex flex-col sm:flex-row items-start sm:items-center justify-between relative z-40">
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
          <div className="flex flex-wrap gap-2 mt-4 sm:mt-0">
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
        />

        {sales.length > itemsPerPage && (
          <nav className="mt-4 flex justify-center items-center space-x-2">
            <button
              onClick={goToPreviousPage}
              disabled={currentPage === 1}
              className="px-4 py-2 rounded-xl bg-gray-200 text-gray-700 hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            <ul className="flex space-x-2">
              {pageNumbers.map((number) => (
                <li key={number}>
                  <button
                    onClick={() => paginate(number)}
                    className={`px-4 py-2 rounded-xl transition-colors ${
                      number === currentPage
                        ? "bg-blue-600 text-white"
                        : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                    }`}
                  >
                    {number}
                  </button>
                </li>
              ))}
            </ul>
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
            db={db}
            appId={appId}
            initialData={editingSale}
          />
        )}

        {isConfirmOpen && (
          <ConfirmModal
            message={confirmMessage}
            onConfirm={confirmAction}
            onCancel={handleCloseConfirmModal}
          />
        )}
      </div>
    </div>
  );
};

export default SalesPage;
