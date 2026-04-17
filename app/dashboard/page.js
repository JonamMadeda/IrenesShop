"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  ShoppingCart,
  Package,
  AlertTriangle,
  BarChart,
  Loader2,
  AlertCircle,
  TrendingUp,
} from "lucide-react";

import { createClient } from "@/utils/supabase/client";
import { getShopContext } from "@/utils/supabase/getShopContext";

// Import the global PageLoader component
import PageLoader from "@/app/components/PageLoader";

/**
 * A functional component for the main dashboard page.
 * It provides a central hub for navigating the application and viewing key metrics.
 * The layout is split into two main sections for alerts and statistics.
 */
export default function Dashboard() {
  const supabase = createClient();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [lowStockItems, setLowStockItems] = useState([]);
  const [salesStats, setSalesStats] = useState({
    totalSales: 0,
    itemsSold: 0,
    totalProfit: 0,
  });
  const [dailySales, setDailySales] = useState([]);
  const [error, setError] = useState(null);

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 3;

  useEffect(() => {
    const checkAuthAndFetchData = async () => {
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      if (!currentUser) {
        window.location.href = "/";
        return;
      }
      setUser(currentUser);

      const { queryId } = await getShopContext(currentUser.id);

      const fetchDashboardData = async () => {
        // Low stock items
        const { data: stockData, error: stockError } = await supabase
          .from("items")
          .select("*")
          .eq("user_id", queryId)
          .lte("quantity", 20);
        
        if (!stockError) setLowStockItems(stockData || []);

        // Sales statistics (Last 30 days)
        const oneMonthAgo = new Date();
        oneMonthAgo.setDate(oneMonthAgo.getDate() - 30);

        const { data: salesData, error: salesError } = await supabase
          .from("sales")
          .select("*")
          .eq("user_id", queryId)
          .gte("sale_date", oneMonthAgo.toISOString())
          .order("sale_date", { ascending: false });

        if (!salesError && salesData) {
          let totalRevenue = 0;
          let itemsSold = 0;
          let totalProfit = 0;
          const dailySalesMap = {};
          const uniqueDates = new Set();

          salesData.forEach((sale) => {
            const sale_revenue = sale.total_revenue || sale.totalRevenue || 0;
            const sale_quantity = sale.quantity || 0;
            const sale_profit = sale.profit || 0;
            const sale_date = sale.sale_date || sale.saleDate;

            totalRevenue += sale_revenue;
            itemsSold += sale_quantity;
            totalProfit += sale_profit;

            if (sale_date) {
              const dateString = new Date(sale_date).toISOString().split("T")[0];
              uniqueDates.add(dateString);
            }
          });

          const sortedDates = Array.from(uniqueDates).sort((a, b) => new Date(b) - new Date(a));
          const lastTwoDates = sortedDates.slice(0, 2);

          salesData.forEach((sale) => {
            const sale_date = sale.sale_date || sale.saleDate;
            const sale_revenue = sale.total_revenue || sale.totalRevenue || 0;
            if (sale_date) {
              const dateString = new Date(sale_date).toISOString().split("T")[0];
              if (lastTwoDates.includes(dateString)) {
                dailySalesMap[dateString] = (dailySalesMap[dateString] || 0) + sale_revenue;
              }
            }
          });

          const sortedDailySales = Object.entries(dailySalesMap).sort(([dateA], [dateB]) => new Date(dateB) - new Date(dateA));

          setSalesStats({
            totalSales: totalRevenue,
            itemsSold: itemsSold,
            totalProfit: totalProfit,
          });
          setDailySales(sortedDailySales);
        }
        setLoading(false);
      };

      fetchDashboardData();

      // Simple real-time for items only to avoid spam
      const itemsChannel = supabase.channel('dashboard_items')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'items', filter: `user_id=eq.${queryId}` }, () => fetchDashboardData())
        .subscribe();
      const salesChannel = supabase.channel('dashboard_sales')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'sales', filter: `user_id=eq.${queryId}` }, () => fetchDashboardData())
        .subscribe();
      
      return () => {
        supabase.removeChannel(itemsChannel);
        supabase.removeChannel(salesChannel);
      };
    };

    checkAuthAndFetchData();
  }, [supabase]);

  // Pagination logic
  const totalPages = Math.ceil(lowStockItems.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedItems = lowStockItems.slice(startIndex, endIndex);

  const handleNextPage = () => {
    setCurrentPage((prevPage) => Math.min(prevPage + 1, totalPages));
  };

  const handlePreviousPage = () => {
    setCurrentPage((prevPage) => Math.max(prevPage - 1, 1));
  };

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 font-sans p-4">
        <div className="bg-white p-8 rounded-2xl shadow-lg max-w-sm w-full text-center border border-gray-100">
          <div className="flex justify-center mb-4 text-red-500">
            <AlertCircle className="h-12 w-12" />
          </div>
          <h2 className="text-xl font-bold text-gray-800 mb-2">Error</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="w-full bg-blue-600 text-white py-3 px-4 rounded-xl hover:bg-blue-700 transition-colors font-semibold"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  // Use the new PageLoader component for a minimal and modern loading state
  if (loading) {
    return <PageLoader />;
  }

  // Safely get the user's first name, with a fallback
  const fullName =
    user?.user_metadata?.display_name ||
    user?.user_metadata?.full_name ||
    "";
  const firstName = fullName.split(" ")[0] || user?.email?.split("@")[0] || "User";
  const lastName = fullName.split(" ").slice(1).join(" ");

  return (
    <div className="flex flex-col justify-center items-center p-8 bg-gray-50 md:min-h-[90svh] font-sans">
      <motion.div
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="w-full max-w-7xl"
      >
        <h1 className="text-2xl sm:text-4xl md:text-5xl font-serif font-semibold text-gray-800 mb-7 md:p-7 sm:p-4 text-center">
          Hello, {firstName} {lastName}
        </h1>

        <div className="flex flex-col sm:flex-row gap-4 mb-8 justify-center">
          <a
            href="/sales"
            className="flex-1 min-w-[200px] flex items-center justify-center px-6 py-7 bg-blue-700 text-white font-semibold rounded-xl hover:bg-blue-800 transition-colors shadow-lg"
          >
            <ShoppingCart className="w-5 h-5 mr-2" /> Record Sale
          </a>
          <a
            href="/stock-manager"
            className="flex-1 min-w-[200px] flex items-center justify-center px-6 py-7 bg-gray-700 text-white font-semibold rounded-xl hover:bg-gray-800 transition-colors shadow-lg"
          >
            <Package className="w-5 h-5 mr-2" /> Manage Stock
          </a>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <motion.div
            className="bg-white px-6 pt-6 pb-20 rounded-2xl shadow-xl border border-gray-200 relative"
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
              <AlertTriangle className="text-yellow-500 w-6 h-6 mr-2" />
              Low Stock Alerts
            </h2>
            {lowStockItems.length > 0 ? (
              <>
                <ul className="space-y-4">
                  {paginatedItems.map((item) => (
                    <li
                      key={item.id}
                      className="bg-yellow-50 p-4 rounded-xl flex justify-between items-center border border-yellow-200"
                    >
                      <span className="font-medium text-gray-700">
                        {item.name}
                      </span>
                      <span className="text-sm font-semibold text-yellow-800">
                        {item.quantity || 0} in stock
                      </span>
                    </li>
                  ))}
                </ul>
                {lowStockItems.length > itemsPerPage && (
                  <div className="absolute bottom-0 left-0 right-0 p-4 flex justify-between items-center bg-white border-t border-gray-200">
                    <button
                      onClick={handlePreviousPage}
                      disabled={currentPage === 1}
                      className="px-4 py-2 text-sm font-semibold rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Previous
                    </button>
                    <span className="text-sm font-medium text-gray-600">
                      Page {currentPage} of {totalPages}
                    </span>
                    <button
                      onClick={handleNextPage}
                      disabled={currentPage === totalPages}
                      className="px-4 py-2 text-sm font-semibold rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Next
                    </button>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center text-gray-500">
                <p>All items are sufficiently stocked. 😊</p>
              </div>
            )}
          </motion.div>

          <motion.div
            className="bg-white p-6 rounded-2xl shadow-xl border border-gray-200"
            initial={{ x: 20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
              <BarChart className="text-blue-500 w-6 h-6 mr-2" />
              Sales Statistics (Last 30 Days)
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="bg-blue-50 p-4 rounded-xl text-center border border-blue-200">
                <p className="text-sm text-blue-800 font-medium">Total Sales</p>
                <p className="text-xl font-bold text-blue-900 mt-1">
                  KSh{salesStats.totalSales.toFixed(2)}
                </p>
              </div>
              <div className="bg-blue-50 p-4 rounded-xl text-center border border-blue-200">
                <p className="text-sm text-blue-800 font-medium">Items Sold</p>
                <p className="text-xl font-bold text-blue-900 mt-1">
                  {salesStats.itemsSold}
                </p>
              </div>
              <div className="bg-green-50 p-4 rounded-xl text-center border border-green-200">
                <p className="text-sm text-green-800 font-medium">
                  Total Profit
                </p>
                <p className="text-xl font-bold text-green-900 mt-1">
                  KSh{salesStats.totalProfit.toFixed(2)}
                </p>
              </div>
            </div>

            <div className="mt-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-2 flex items-center">
                <TrendingUp className="text-cyan-500 w-5 h-5 mr-2" /> Daily
                Sales
              </h3>
              {dailySales.length > 0 ? (
                <ul className="space-y-2">
                  {dailySales.map(([date, sales]) => (
                    <li
                      key={date}
                      className="flex justify-between items-center bg-gray-50 p-3 rounded-md"
                    >
                      <span className="text-sm font-medium text-gray-600">
                        {date}
                      </span>
                      <span className="text-sm font-bold text-gray-900">
                        KSh{sales.toFixed(2)}
                      </span>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="text-center text-gray-500 p-4 bg-gray-50 rounded-md">
                  <p>
                    No sales records found. Start recording sales to see data
                    here.
                  </p>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
}
