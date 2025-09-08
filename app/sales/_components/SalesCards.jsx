import React from "react";
import { motion } from "framer-motion";
import { ShoppingCart, DollarSign, Package, TrendingUp } from "lucide-react";

const SalesCards = ({
  totalSales,
  totalRevenue,
  totalProfit,
  totalItemsSold,
}) => {
  return (
    <div className="w-full max-w-5xl grid grid-cols-1 md:grid-cols-4 gap-4 md:gap-6 mb-8">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="bg-white p-6 rounded-3xl shadow-xl border border-gray-200 flex flex-col items-center text-center transform hover:scale-105 transition-transform duration-300"
      >
        <div className="text-blue-600 mb-3">
          <ShoppingCart size={40} />
        </div>
        <h3 className="text-xl font-semibold text-gray-800">Total Sales</h3>
        <p className="text-2xl font-bold text-gray-900 mt-1">{totalSales}</p>
      </motion.div>
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="bg-white p-6 rounded-3xl shadow-xl border border-gray-200 flex flex-col items-center text-center transform hover:scale-105 transition-transform duration-300"
      >
        <div className="text-green-600 mb-3">
          <DollarSign size={40} />
        </div>
        <h3 className="text-xl font-semibold text-gray-800">Total Revenue</h3>
        <p className="text-2xl font-bold text-gray-900 mt-1">
          KSh {totalRevenue.toFixed(2)}
        </p>
      </motion.div>
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, delay: 0.3 }}
        className="bg-white p-6 rounded-3xl shadow-xl border border-gray-200 flex flex-col items-center text-center transform hover:scale-105 transition-transform duration-300"
      >
        <div className="text-purple-600 mb-3">
          <TrendingUp size={40} />
        </div>
        <h3 className="text-xl font-semibold text-gray-800">Total Profit</h3>
        <p className="text-2xl font-bold text-gray-900 mt-1">
          KSh {totalProfit.toFixed(2)}
        </p>
      </motion.div>
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, delay: 0.4 }}
        className="bg-white p-6 rounded-3xl shadow-xl border border-gray-200 flex flex-col items-center text-center transform hover:scale-105 transition-transform duration-300"
      >
        <div className="text-orange-600 mb-3">
          <Package size={40} />
        </div>
        <h3 className="text-xl font-semibold text-gray-800">
          Total Items Sold
        </h3>
        <p className="text-2xl font-bold text-gray-900 mt-1">
          {totalItemsSold}
        </p>
      </motion.div>
    </div>
  );
};

export default SalesCards;
