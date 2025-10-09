"use client";
import React, { useState, useEffect } from "react";
import {
  DollarSign,
  ShoppingCart,
  Package,
  BarChart2,
  Download,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  TrendingDown,
  AlertCircle,
  Calendar as CalendarIcon,
} from "lucide-react";
import {
  collection,
  query,
  where,
  onSnapshot,
  orderBy,
  doc,
} from "firebase/firestore";
import { db, auth } from "@/firebase/firebase.client";
import { onAuthStateChanged } from "firebase/auth";
import { Chart as ChartJS, registerables } from "chart.js";
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
  isValid,
} from "date-fns";
import RecentTransactions from "./_components/RecentTransactions";
import PageLoader from "@/app/components/PageLoader";

// Register ChartJS components
ChartJS.register(...registerables);

// Get date range based on period
const getDateRange = (period, customDate = new Date()) => {
  const date = new Date(customDate);
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
      return { start: startOfMonth(date), end: endOfMonth(date) }; // Changed default to monthly
  }
};

// Report Card Component
const ReportCard = ({
  title,
  value,
  icon,
  color,
  change,
  isCurrency = false,
}) => (
  <div className="bg-white p-6 rounded-2xl shadow-lg border border-gray-100 transform transition-all hover:scale-105">
    <div className="flex items-start justify-between mb-4">
      <div className={`p-3 rounded-xl ${color} bg-opacity-20`}>
        {React.cloneElement(icon, { className: "h-6 w-6" })}
      </div>
      <span
        className={`text-sm font-semibold flex items-center gap-1 ${
          change > 0 ? "text-green-600" : "text-red-600"
        }`}
      >
        {change > 0 ? (
          <TrendingUp className="w-4 h-4" />
        ) : (
          <TrendingDown className="w-4 h-4" />
        )}
        {Math.abs(change)}%
      </span>
    </div>
    <h3 className="text-sm font-medium text-gray-500 mb-1">{title}</h3>
    <p className="text-3xl font-bold text-gray-900 truncate">
      {isCurrency ? `KSh${value.toLocaleString()}` : value.toLocaleString()}
    </p>
  </div>
);

// Top Items Component
const TopItems = ({ items, limit = 5 }) => (
  <div className="bg-white p-6 rounded-2xl shadow-lg border border-gray-100">
    <h3 className="text-lg font-bold text-gray-800 mb-4">
      Top Selling Items 🚀
    </h3>
    <div className="space-y-4">
      {items.slice(0, limit).map((item, index) => (
        <div
          key={index}
          className="flex items-center justify-between border-b pb-2 last:pb-0 last:border-b-0"
        >
          <div className="flex items-center space-x-3">
            <span className="w-8 h-8 flex items-center justify-center rounded-full bg-blue-50 text-blue-600 font-bold text-sm">
              {index + 1}
            </span>
            <span className="text-base font-medium text-gray-800 truncate max-w-[150px]">
              {item.itemName}
            </span>
          </div>
          <div className="text-right">
            <p className="text-sm font-medium text-gray-600">
              {item.totalQuantity} sold
            </p>
            <p className="text-sm font-medium text-green-600">
              KSh{item.totalRevenue?.toFixed(2)}
            </p>
          </div>
        </div>
      ))}
    </div>
  </div>
);

// Main Reports Page Component
export default function Reports() {
  const [userId, setUserId] = useState(null);
  // 💡 CHANGED: Default period to 'monthly'
  const [period, setPeriod] = useState("monthly");
  const [currentDate, setCurrentDate] = useState(new Date());
  // 💡 CHANGED: Initialize dateRange with 'monthly'
  const [dateRange, setDateRange] = useState(() => getDateRange("monthly"));
  const [salesData, setSalesData] = useState([]);
  const [debtData, setDebtData] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [topItems, setTopItems] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Format date range for display
  const formatDateRange = () => {
    const { start, end } = dateRange;
    // Check if dates are valid before formatting
    if (!isValid(start) || !isValid(end)) {
      return "Invalid Date Range";
    }
    if (period === "daily") return format(start, "EEEE, MMMM dd, yyyy");
    if (period === "weekly")
      return `${format(start, "MMM dd")} - ${format(end, "MMM dd, yyyy")}`;
    if (period === "monthly") return `${format(start, "MMMM yyyy")}`;
    if (period === "yearly") return `${format(start, "yyyy")}`;
    return format(start, "MMMM yyyy"); // Changed default display to monthly format
  };

  // Fetch user and data
  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      if (!user) {
        console.log("No authenticated user found. Redirecting.");
        window.location.href = "/";
        return;
      }

      const userDocRef = doc(db, "users", user.uid);
      const unsubscribeUser = onSnapshot(
        userDocRef,
        (docSnap) => {
          const userData = docSnap.data();
          if (
            docSnap.exists() &&
            userData?.subscriptionStatus === "active" &&
            userData?.expiresAt.toDate() > new Date()
          ) {
            setUserId(user.uid);
            setIsLoading(false);
          } else {
            console.log(
              "Subscription is inactive or expired. Redirecting to root."
            );
            window.location.href = "/";
          }
        },
        (err) => {
          console.error("Error fetching user data:", err);
          setError("Failed to verify subscription.");
          window.location.href = "/";
        }
      );

      return () => unsubscribeUser();
    });

    return () => unsubscribeAuth();
  }, []);

  useEffect(() => {
    if (!userId) {
      setIsLoading(true);
      return;
    }

    const fetchSalesAndDebtData = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const { start, end } = dateRange;
        // Fetch sales data
        const salesQuery = query(
          collection(db, "users", userId, "sales"),
          where("saleDate", ">=", start),
          where("saleDate", "<=", end),
          orderBy("saleDate", "desc")
        );
        const unsubscribeSales = onSnapshot(salesQuery, (snapshot) => {
          const sales = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
            saleDate: doc.data().saleDate?.toDate(),
          }));

          const itemGroups = sales
            .reduce((acc, sale) => {
              const existing = acc.find((i) => i.itemId === sale.itemId);
              if (existing) {
                existing.totalQuantity += sale.quantity;
                existing.totalRevenue += sale.totalRevenue || 0;
              } else {
                acc.push({
                  itemId: sale.itemId,
                  itemName: sale.itemName,
                  category: sale.itemCategory || "Uncategorized",
                  totalQuantity: sale.quantity,
                  totalRevenue: sale.totalRevenue || 0,
                });
              }
              return acc;
            }, [])
            .sort((a, b) => b.totalQuantity - a.totalQuantity);

          setSalesData(sales);
          setTopItems(itemGroups);
        });

        // Fetch debt data
        const debtQuery = query(
          collection(db, "users", userId, "debts"),
          where("createdAt", ">=", start),
          where("createdAt", "<=", end)
        );
        const unsubscribeDebt = onSnapshot(debtQuery, (snapshot) => {
          const debts = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
            createdAt: doc.data().createdAt?.toDate(),
          }));
          setDebtData(debts);
        });

        setIsLoading(false);
        return () => {
          unsubscribeSales();
          unsubscribeDebt();
        };
      } catch (error) {
        console.error("Error fetching data:", error);
        setError("Failed to load sales and debt data");
        setIsLoading(false);
      }
    };

    fetchSalesAndDebtData();
  }, [userId, period, dateRange]);

  // Combine sales and debt data into a single transactions array
  useEffect(() => {
    const combinedTransactions = [
      ...salesData.map((s) => ({
        type: "Sale",
        ...s,
        date: s.saleDate,
      })),
      ...debtData.map((d) => ({
        type: "Debt",
        ...d,
        date: d.createdAt,
      })),
    ].sort((a, b) => b.date - a.date);
    setTransactions(combinedTransactions);
  }, [salesData, debtData]);

  // Handle period change
  const handlePeriodChange = (newPeriod) => {
    setPeriod(newPeriod);
    setDateRange(getDateRange(newPeriod, currentDate));
  };

  // Navigate dates
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
    setDateRange(getDateRange(period, newDate));
  };

  // Handle native date input selection
  const handleDateSelect = (e) => {
    const selectedDate = new Date(e.target.value);
    setCurrentDate(selectedDate);
    setPeriod("daily");
    setDateRange(getDateRange("daily", selectedDate));
  };

  // Calculate metrics
  const totalSalesCount = salesData.length;
  const totalRevenue = salesData.reduce(
    (sum, sale) => sum + (sale.totalRevenue || 0),
    0
  );
  const totalCost = salesData.reduce(
    (sum, sale) => sum + (sale.totalCost || 0),
    0
  );
  const totalDebt = debtData.reduce(
    (sum, debt) => sum + (debt.totalAmount || 0),
    0
  );
  // This is the line that was changed
  const totalProfit = totalRevenue - totalCost;
  const totalItems = salesData.reduce((sum, sale) => sum + sale.quantity, 0);

  // Export to CSV function
  const exportToCSV = () => {
    const headers = ["Type", "Date", "Customer", "Item", "Quantity", "Amount"];
    const csvContent = [
      headers.join(","),
      ...transactions.map((t) =>
        [
          `"${t.type}"`,
          `"${format(t.date || new Date(), "yyyy-MM-dd")}"`,
          `"${t.customerFirstName || "N/A"}"`,
          `"${t.itemName || "N/A"}"`,
          t.quantity || "N/A",
          t.amount,
        ].join(",")
      ),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `sales_debt_report_${period}_${format(
      new Date(),
      "yyyyMMdd"
    )}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
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

  // Applying user-defined minimum height for the page container
  const pageStyle = { minHeight: "90vh" };

  if (isLoading) {
    return <PageLoader />;
  }

  return (
    <div className="bg-gray-50 py-8 px-4 sm:px-6 font-sans" style={pageStyle}>
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8 flex flex-col sm:flex-row items-center sm:items-center justify-between">
          <div>
            <h1 className="text-3xl sm:text-3xl font-semibold text-gray-900 mb-1">
              Sales Reports 📈
            </h1>
          </div>
          <div className="mt-4 sm:mt-0 flex items-center gap-2">
            <button
              onClick={exportToCSV}
              className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 text-sm rounded-xl hover:bg-blue-700 transition-colors font-medium"
            >
              <Download className="h-4 w-4" />
              <span>Download Report</span>
            </button>
          </div>
        </div>

        {/* Period Selector & Date Navigation */}
        <div className="bg-white p-4 rounded-2xl shadow-lg border border-gray-100 mb-8 flex flex-col sm:flex-row items-start sm:items-center justify-between relative z-40">
          <div className="flex items-center space-x-2 mb-4 sm:mb-0">
            <button
              onClick={() => navigateDate("prev")}
              className="p-2 rounded-full hover:bg-gray-100 transition-colors text-gray-600"
              aria-label="Previous period"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button
              onClick={() => navigateDate("next")}
              className="p-2 rounded-full hover:bg-gray-100 transition-colors text-gray-600"
              aria-label="Next period"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
            <div className="relative">
              <input
                type="date"
                value={format(currentDate, "yyyy-MM-dd")}
                onChange={handleDateSelect}
                className="block appearance-none w-full bg-gray-50 border border-gray-300 text-gray-800 py-2 px-4 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 pr-10 text-sm md:text-base"
              />
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                <CalendarIcon className="h-5 w-5" />
              </div>
            </div>
          </div>
          <div className="flex items-center space-x-2">
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

        {/* Report Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8 relative z-30">
          <ReportCard
            title="Total Profit"
            value={totalProfit}
            icon={<BarChart2 />}
            color="text-orange-600"
            change={5.2}
            isCurrency={true}
          />
          <ReportCard
            title="Total Revenue"
            value={totalRevenue}
            icon={<DollarSign />}
            color="text-green-600"
            change={8.3}
            isCurrency={true}
          />
          <ReportCard
            title="Total Debt"
            value={totalDebt}
            icon={<ShoppingCart />}
            color="text-red-600"
            change={12.5}
            isCurrency={true}
          />
          <ReportCard
            title="Items Sold"
            value={totalItems}
            icon={<Package />}
            color="text-blue-600"
            change={-2.1}
          />
        </div>

        {/* Top Items and Summary */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <TopItems items={topItems} />
          <div className="bg-white p-6 rounded-2xl shadow-lg border border-gray-100">
            <h3 className="text-lg font-bold text-gray-800 mb-4">
              Summary Details 📊
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Selected Period:</span>
                <span className="font-semibold text-gray-800">
                  {formatDateRange()}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Total Transactions:</span>
                <span className="font-semibold text-gray-800">
                  {totalSalesCount.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Total Revenue:</span>
                <span className="font-bold text-green-600">
                  KSh{totalRevenue.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Total Profit:</span>
                <span className="font-bold text-blue-600">
                  KSh{totalProfit.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Total Debt:</span>
                <span className="font-bold text-red-600">
                  KSh{totalDebt.toLocaleString()}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Transactions Table */}
        <RecentTransactions transactions={transactions} />
      </div>
    </div>
  );
}
