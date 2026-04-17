"use client";

import React, { useState, useEffect } from "react";
import { createClient } from "@/utils/supabase/client";
import { getShopContext } from "@/utils/supabase/getShopContext";

import DebtTable from "./_components/DebtTable";
import DebtForm from "./_components/DebtForm";
import ConfirmationModal from "./_components/ConfirmationModal";
import PageLoader from "@/app/components/PageLoader";
import DebtSummary from "./_components/DebtSummary";
import DebtHeader from "./_components/DebtHeader";
import DateFilter from "./_components/DateFilter";

// appId and initialAuthToken logic removed for Supabase migration

const DebtTracker = () => {
  const supabase = createClient();
  // State variables
  const [customerFirstName, setCustomerFirstName] = useState("");
  const [customerLastName, setCustomerLastName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [itemName, setItemName] = useState("");
  const [itemQuantity, setItemQuantity] = useState(1);
  const [itemPrice, setItemPrice] = useState(0);
  const [dateTaken, setDateTaken] = useState("");
  const [returnDate, setReturnDate] = useState("");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const [isPageLoading, setIsPageLoading] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState({ type: "", message: "" });
  const [userId, setUserId] = useState(null);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [debts, setDebts] = useState([]);
  const [items, setItems] = useState([]);
  const [isPopupOpen, setIsPopupOpen] = useState(false);
  const [currentRecord, setCurrentRecord] = useState(null);
  const [showOverdueOnly, setShowOverdueOnly] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [confirmMessage, setConfirmMessage] = useState("");
  const [confirmAction, setConfirmAction] = useState(() => () => {});
  const [refreshTick, setRefreshTick] = useState(0);

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // 📅 State for Date Filtering
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().slice(0, 10)
  );
  const [activeRange, setActiveRange] = useState("Monthly"); // Default to 'Monthly'

  const refreshDebts = () => {
    setRefreshTick((current) => current + 1);
  };

  // 🔒 Subscription check and authentication
  useEffect(() => {
    const today = new Date().toISOString().slice(0, 10);
    setDateTaken(today);
    setSelectedDate(today);

    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        window.location.href = "/";
        return;
      }

      const { queryId } = await getShopContext(user.id);
      setUserId(queryId);
      setIsAuthReady(true);
      setIsPageLoading(false);
    };

    checkUser();
  }, [supabase]);

  // 🧾 Real-time listener for debts and items
  useEffect(() => {
    if (isAuthReady && userId) {
      const fetchDebtsAndItems = async () => {
        const { data: debtsData, error: debtsError } = await supabase
          .from("debts")
          .select("*")
          .eq("user_id", userId)
          .order("date_taken", { ascending: false });
        
        if (debtsError) {
          console.error("Error fetching debts:", debtsError);
          showStatus("error", "Failed to load debt records.");
        } else {
          setDebts((debtsData || []).map(debt => ({
            ...debt,
            customerFirstName: debt.customer_first_name || debt.customerFirstName,
            customerLastName: debt.customer_last_name || debt.customerLastName,
            phoneNumber: debt.customer_phone || debt.phoneNumber,
            itemName: debt.item_name || debt.itemName,
            itemQuantity: debt.item_quantity || debt.itemQuantity,
            itemPrice: debt.total_amount && debt.item_quantity
              ? Number(debt.total_amount) / Number(debt.item_quantity)
              : debt.itemPrice,
            totalAmount: debt.total_amount || debt.totalAmount,
            dateTaken: debt.date_taken || debt.dateTaken,
            returnDate: debt.return_date || debt.returnDate,
            isPaid: debt.status === "paid" || debt.isPaid,
          })));
        }

        const { data: itemsData, error: itemsError } = await supabase
          .from("items")
          .select("*")
          .eq("user_id", userId);
        
        if (itemsError) {
          console.error("Error fetching items:", itemsError);
          showStatus("error", "Failed to load item list.");
        } else {
          setItems((itemsData || []).map(item => ({
            ...item,
            buyingPrice: item.cost ?? item.buyingPrice,
            sellingPrice: item.price ?? item.sellingPrice,
          })));
        }
      };

      fetchDebtsAndItems();

      const debtsChannel = supabase.channel('debts_changes')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'debts', filter: `user_id=eq.${userId}` }, () => fetchDebtsAndItems())
        .subscribe();
      
      const itemsChannel = supabase.channel('items_changes_debt')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'items', filter: `user_id=eq.${userId}` }, () => fetchDebtsAndItems())
        .subscribe();

      return () => {
        supabase.removeChannel(debtsChannel);
        supabase.removeChannel(itemsChannel);
      };
    }
  }, [isAuthReady, userId, supabase, refreshTick]);

  // Utility: show status messages
  const showStatus = (type, message) => {
    setStatusMessage({ type, message });
    setTimeout(() => setStatusMessage({ type: "", message: "" }), 4000);
  };

  // 🧮 Form functions
  const openPopup = (record = null) => {
    // Get today's date in YYYY-MM-DD format
    const today = new Date().toISOString().slice(0, 10);

    setCurrentRecord(record);
    if (record) {
      // Logic for EDITING an existing record
      setCustomerFirstName(record.customerFirstName);
      setCustomerLastName(record.customerLastName);
      setPhoneNumber(record.phoneNumber);
      setItemName(record.itemName);
      setItemQuantity(record.itemQuantity);
      setItemPrice(record.itemPrice);
      setDateTaken(record.dateTaken);
      setReturnDate(record.returnDate);
    } else {
      // Logic for CREATING a new record
      setCustomerFirstName("");
      setCustomerLastName("");
      setPhoneNumber("");
      setItemName("");
      setItemQuantity(1);
      setItemPrice(0);
      // ✅ Set default 'Date Taken' to today's date
      setDateTaken(today);
      setReturnDate("");
    }
    setIsPopupOpen(true);
  };

  const closePopup = () => {
    setIsPopupOpen(false);
    setCurrentRecord(null);
    setIsDropdownOpen(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    if (
      !customerFirstName ||
      !customerLastName ||
      !itemName ||
      itemQuantity <= 0 ||
      itemPrice <= 0 ||
      !returnDate ||
      !userId
    ) {
      showStatus(
        "error",
        "Please fill out all required fields and ensure you are authenticated."
      );
      setIsLoading(false);
      return;
    }

    const totalAmount = itemQuantity * itemPrice;

    // Base object for record (without server timestamp)
    let debtData = {
      customer_first_name: customerFirstName,
      customer_last_name: customerLastName,
      customer_phone: phoneNumber,
      item_name: itemName,
      item_quantity: Number(itemQuantity),
      total_amount: totalAmount,
      date_taken: new Date(dateTaken),
      return_date: new Date(returnDate),
      status: "unpaid",
    };

    try {
      if (currentRecord && currentRecord.id) {
        const { error } = await supabase
          .from("debts")
          .update(debtData)
          .eq("id", currentRecord.id)
          .eq("user_id", userId);
        
        if (error) throw error;
        showStatus("success", "Debt record updated successfully!");
      } else {
        const { error } = await supabase
          .from("debts")
          .insert({
            ...debtData,
            user_id: userId,
            created_at: new Date(),
          });
        if (error) throw error;
        showStatus("success", "Debt record saved successfully!");
      }
      refreshDebts();
      closePopup();
    } catch (error) {
      console.error("Error saving debt record:", error);
      showStatus("error", "Failed to save debt record. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // 🗑️ Delete & Paid toggle
  const handleDelete = (id) => {
    setConfirmMessage(
      "Are you sure that you want to carry out this operation? You are about to permanently delete this debt record. This is a high-risk action, and deleted data cannot be recovered."
    );
    setConfirmAction(() => async () => {
      setShowConfirmModal(false);
      setIsLoading(true);
      try {
        const { error } = await supabase
          .from("debts")
          .delete()
          .eq("id", id)
          .eq("user_id", userId);
        if (error) throw error;
        showStatus("success", "Debt record deleted successfully!");
        refreshDebts();
      } catch (error) {
        console.error("Error deleting debt record:", error);
        showStatus("error", "Failed to delete debt record.");
      } finally {
        setIsLoading(false);
      }
    });
    setShowConfirmModal(true);
  };

  const handlePaidToggle = (debt) => {
    if (debt.isPaid) {
      setConfirmMessage("Are you sure you want to mark this debt as unpaid?");
      setConfirmAction(() => async () => {
        setShowConfirmModal(false);
        setIsLoading(true);
        try {
          const { error } = await supabase
            .from("debts")
            .update({ status: "unpaid" })
            .eq("id", debt.id)
            .eq("user_id", userId);
          
          if (error) throw error;
          showStatus("success", "Debt marked as unpaid.");
          refreshDebts();
        } catch (error) {
          console.error("Error updating paid status:", error);
          showStatus("error", "Failed to update debt status.");
        } finally {
          setIsLoading(false);
        }
      });
    } else {
      setConfirmMessage(
        "Are you sure you want to mark this debt as paid? This will delete the debt record and add it to sales."
      );
      setConfirmAction(() => async () => {
        setShowConfirmModal(false);
        setIsLoading(true);
        try {
          const matchedItem = items.find((item) => item.name === debt.itemName);
          const unitCost = Number(matchedItem?.cost ?? matchedItem?.buyingPrice ?? 0);
          const itemCategory = matchedItem?.category || "Uncategorized";

          // Move to sales
          const salesRecord = { 
            item_id: matchedItem?.id || "",
            item_name: debt.itemName,
            total_revenue: debt.totalAmount,
            total_cost: unitCost * debt.itemQuantity,
            profit: debt.totalAmount - (unitCost * debt.itemQuantity),
            quantity: debt.itemQuantity,
            sale_date: new Date(),
            item_category: itemCategory,
            user_id: userId,
          };
          
          const { error: saleError } = await supabase.from("sales").insert(salesRecord);
          if (saleError) throw saleError;

          const { error: debtError } = await supabase
            .from("debts")
            .delete()
            .eq("id", debt.id)
            .eq("user_id", userId);
          if (debtError) throw debtError;

          showStatus("success", "Debt paid and moved to sales successfully!");
          refreshDebts();
        } catch (error) {
          console.error("Error marking debt as paid:", error);
          showStatus("error", "Failed to mark debt as paid.");
        } finally {
          setIsLoading(false);
        }
      });
    }
    setShowConfirmModal(true);
  };

  // 🔍 Pagination and filters
  const overdueDebts = debts.filter(
    (debt) => !debt.isPaid && new Date(debt.returnDate) < new Date()
  );

  const getDisplayedDebts = () => {
    const listToDisplay = showOverdueOnly ? overdueDebts : debts;
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return listToDisplay.slice(startIndex, endIndex);
  };

  const displayedDebts = getDisplayedDebts();
  const totalPages = Math.ceil(
    (showOverdueOnly ? overdueDebts.length : debts.length) / itemsPerPage
  );

  // 📊 Summary Calculations for DebtSummary
  const totalDebts = debts.length;
  const totalDebtAmount = debts.reduce(
    (sum, debt) => sum + debt.totalAmount,
    0
  );
  const totalOverdueAmount = overdueDebts.reduce(
    (sum, debt) => sum + debt.totalAmount,
    0
  );
  const totalItems = debts.reduce((sum, debt) => sum + debt.itemQuantity, 0);

  if (isPageLoading) return <PageLoader />;

  return (
    <div className="min-h-[90vh] bg-gray-100 p-4 sm:p-8 font-sans antialiased">
      <div className="max-w-7xl mx-auto bg-white rounded-xl shadow-2xl p-6 sm:p-12 border border-gray-100">
        <DebtHeader openPopup={openPopup} />

        <DateFilter
          selectedDate={selectedDate}
          setSelectedDate={setSelectedDate}
          activeRange={activeRange}
          setActiveRange={setActiveRange}
        />

        <DebtSummary
          totalDebts={totalDebts}
          totalDebtAmount={totalDebtAmount}
          totalOverdueAmount={totalOverdueAmount}
          totalItems={totalItems}
        />

        <DebtTable
          debts={debts}
          overdueDebts={overdueDebts}
          displayedDebts={displayedDebts}
          openPopup={openPopup}
          showOverdueOnly={showOverdueOnly}
          setShowOverdueOnly={setShowOverdueOnly}
          handlePaidToggle={handlePaidToggle}
          handleDelete={handleDelete}
          statusMessage={statusMessage}
          showConfirmModal={showConfirmModal}
          confirmMessage={confirmMessage}
          confirmAction={confirmAction}
          setShowConfirmModal={setShowConfirmModal}
        />
      </div>

      <DebtForm
        isPopupOpen={isPopupOpen}
        closePopup={closePopup}
        handleSubmit={handleSubmit}
        isLoading={isLoading}
        currentRecord={currentRecord}
        customerFirstName={customerFirstName}
        setCustomerFirstName={setCustomerFirstName}
        customerLastName={customerLastName}
        setCustomerLastName={setCustomerLastName}
        phoneNumber={phoneNumber}
        setPhoneNumber={setPhoneNumber}
        itemName={itemName}
        setItemName={setItemName}
        itemQuantity={itemQuantity}
        setItemQuantity={setItemQuantity}
        itemPrice={itemPrice}
        setItemPrice={setItemPrice}
        dateTaken={dateTaken}
        setDateTaken={setDateTaken}
        returnDate={returnDate}
        setReturnDate={setReturnDate}
        items={items}
        isDropdownOpen={isDropdownOpen}
        setIsDropdownOpen={setIsDropdownOpen}
      />

      {showConfirmModal && (
        <ConfirmationModal
          message={confirmMessage}
          onConfirm={confirmAction}
          onCancel={() => setShowConfirmModal(false)}
        />
      )}
    </div>
  );
};

export default DebtTracker;
