import React from "react";
import { DollarSign, Package, ShoppingCart, TrendingUp } from "lucide-react";

const SalesSummary = ({
  totalSalesRecords,
  totalRevenue,
  totalProfit,
  totalItemsSold,
}) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {/* Total Sales Records Card */}
      <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white p-6 rounded-2xl shadow-lg flex flex-col justify-between">
        <div>
          <div className="flex justify-between items-center mb-1">
            <p className="text-sm font-medium opacity-80">
              Total Sales Records
            </p>
            <Package className="h-5 w-5 opacity-70" />
          </div>
          <p className="text-4xl font-extrabold">{totalSalesRecords}</p>
        </div>
        <div className="mt-4 text-xs opacity-70">
          Number of individual sale transactions.
        </div>
      </div>

      {/* Total Items Sold Card */}
      <div className="bg-gradient-to-r from-purple-500 to-purple-600 text-white p-6 rounded-2xl shadow-lg flex flex-col justify-between">
        <div>
          <div className="flex justify-between items-center mb-1">
            <p className="text-sm font-medium opacity-80">Total Items Sold</p>
            <ShoppingCart className="h-5 w-5 opacity-70" />
          </div>
          <p className="text-4xl font-extrabold">{totalItemsSold}</p>
        </div>
        <div className="mt-4 text-xs opacity-70">
          Total quantity of all items sold.
        </div>
      </div>

      {/* Total Revenue Card */}
      <div className="bg-gradient-to-r from-gray-800 to-gray-900 text-white p-6 rounded-2xl shadow-lg flex flex-col justify-between">
        <div>
          <div className="flex justify-between items-center mb-1">
            <p className="text-sm font-medium opacity-80">Total Revenue</p>
            <DollarSign className="h-5 w-5 opacity-70" />
          </div>
          <p className="text-4xl font-extrabold">
            KSh {totalRevenue.toLocaleString()}
          </p>
        </div>
        <div className="mt-4 text-xs opacity-70">
          Total money earned from sales.
        </div>
      </div>

      {/* Total Profit Card */}
      <div className="bg-gradient-to-r from-green-500 to-green-600 text-white p-6 rounded-2xl shadow-lg flex flex-col justify-between">
        <div>
          <div className="flex justify-between items-center mb-1">
            <p className="text-sm font-medium opacity-80">Total Profit</p>
            <TrendingUp className="h-5 w-5 opacity-70" />
          </div>
          <p className="text-4xl font-extrabold">
            KSh {totalProfit.toLocaleString()}
          </p>
        </div>
        <div className="mt-4 text-xs opacity-70">
          Gross profit from all sales.
        </div>
      </div>
    </div>
  );
};

export default SalesSummary;
