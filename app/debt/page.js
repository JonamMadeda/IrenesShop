"use client";

import React, { useState, useEffect } from "react";
import {
  collection,
  addDoc,
  serverTimestamp,
  onSnapshot,
  doc,
  updateDoc,
  deleteDoc,
} from "firebase/firestore";
import {
  onAuthStateChanged,
  signInAnonymously,
  signInWithCustomToken,
} from "firebase/auth";

// Correct import from your Firebase client file
import { db, auth } from "@/firebase/firebase.client.js";

import DebtTable from "./_components/DebtTable";
import DebtForm from "./_components/DebtForm";
import ConfirmationModal from "./_components/ConfirmationModal";
import PageLoader from "@/app/components/PageLoader";

// Global variables provided by the environment
const initialAuthToken =
  typeof __initial_auth_token !== "undefined" ? __initial_auth_token : null;

const DebtTracker = () => {
  // State for form fields
  const [customerFirstName, setCustomerFirstName] = useState("");
  const [customerLastName, setCustomerLastName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [itemName, setItemName] = useState("");
  const [itemQuantity, setItemQuantity] = useState(1);
  const [itemPrice, setItemPrice] = useState(0);
  const [dateTaken, setDateTaken] = useState("");
  const [returnDate, setReturnDate] = useState("");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  // State for UI and status messages
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

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Set initial dateTaken to the current date and set up auth listener
  useEffect(() => {
    const today = new Date().toISOString().slice(0, 10);
    setDateTaken(today);

    const unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        try {
          if (initialAuthToken) {
            await signInWithCustomToken(auth, initialAuthToken);
          } else {
            await signInAnonymously(auth);
          }
        } catch (error) {
          console.error("Failed to sign in:", error);
        }
      }
      setUserId(user ? user.uid : null);
      setIsAuthReady(true);
    });

    return () => unsubscribeAuth();
  }, []);

  // Real-time listener for debts and items collection
  useEffect(() => {
    if (isAuthReady && userId) {
      const debtCollectionRef = collection(db, `users/${userId}/debts`);
      const itemsCollectionRef = collection(db, `users/${userId}/items`);

      const unsubscribeSnapshot = onSnapshot(
        debtCollectionRef,
        (snapshot) => {
          const debtList = snapshot.docs.map((doc) => {
            const data = doc.data();
            return {
              id: doc.id,
              ...data,
              dateTaken: data.dateTaken.toDate().toISOString().slice(0, 10),
              returnDate: data.returnDate.toDate().toISOString().slice(0, 10),
            };
          });
          setDebts(
            debtList.sort(
              (a, b) => new Date(b.dateTaken) - new Date(a.dateTaken)
            )
          );
          setIsPageLoading(false);
        },
        (error) => {
          console.error("Error fetching debts:", error);
          showStatus("error", "Failed to load debt records.");
          setIsPageLoading(false);
        }
      );

      const unsubscribeItems = onSnapshot(
        itemsCollectionRef,
        (snapshot) => {
          const itemsList = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          }));
          setItems(itemsList);
        },
        (error) => {
          console.error("Error fetching items:", error);
          showStatus("error", "Failed to load item list.");
        }
      );

      return () => {
        unsubscribeSnapshot();
        unsubscribeItems();
      };
    }
  }, [isAuthReady, userId]);

  // Function to show a status message for a short period
  const showStatus = (type, message) => {
    setStatusMessage({ type, message });
    setTimeout(() => {
      setStatusMessage({ type: "", message: "" });
    }, 4000);
  };

  const openPopup = (record = null) => {
    setCurrentRecord(record);
    if (record) {
      setCustomerFirstName(record.customerFirstName);
      setCustomerLastName(record.customerLastName);
      setPhoneNumber(record.phoneNumber);
      setItemName(record.itemName);
      setItemQuantity(record.itemQuantity);
      setItemPrice(record.itemPrice);
      setDateTaken(record.dateTaken);
      setReturnDate(record.returnDate);
    } else {
      setCustomerFirstName("");
      setCustomerLastName("");
      setPhoneNumber("");
      setItemName("");
      setItemQuantity(1);
      setItemPrice(0);
      setDateTaken(new Date().toISOString().slice(0, 10));
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
    const debtRecord = {
      customerFirstName,
      customerLastName,
      phoneNumber,
      itemName,
      itemQuantity: Number(itemQuantity),
      itemPrice: Number(itemPrice),
      totalAmount,
      dateTaken: new Date(dateTaken),
      returnDate: new Date(returnDate),
      isPaid: false,
      createdAt: serverTimestamp(),
    };

    try {
      const debtCollectionRef = collection(db, `users/${userId}/debts`);

      if (currentRecord) {
        const docRef = doc(db, debtCollectionRef.path, currentRecord.id);
        await updateDoc(docRef, debtRecord);
        showStatus("success", "Debt record updated successfully!");
      } else {
        await addDoc(debtCollectionRef, debtRecord);
        showStatus("success", "Debt record saved successfully!");
      }
      closePopup();
    } catch (error) {
      console.error("Error saving debt record:", error);
      showStatus("error", "Failed to save debt record. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id) => {
    setShowConfirmModal(false);
    setIsLoading(true);
    try {
      const docRef = doc(db, `users/${userId}/debts`, id);
      await deleteDoc(docRef);
      showStatus("success", "Debt record deleted successfully!");
    } catch (error) {
      console.error("Error deleting debt record:", error);
      showStatus("error", "Failed to delete debt record.");
    } finally {
      setIsLoading(false);
    }
  };

  const handlePaidToggle = async (debt) => {
    setShowConfirmModal(false);
    setIsLoading(true);
    try {
      const docRef = doc(db, `users/${userId}/debts`, debt.id);
      await updateDoc(docRef, { isPaid: !debt.isPaid });
      showStatus(
        `success`,
        `Debt marked as ${debt.isPaid ? "unpaid" : "paid"}.`
      );
    } catch (error) {
      console.error("Error updating paid status:", error);
      showStatus("error", "Failed to update debt status.");
    } finally {
      setIsLoading(false);
    }
  };

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

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  const handlePrevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  if (isPageLoading) {
    return <PageLoader />;
  }

  return (
    <div className="min-h-[90vh] bg-gray-100 p-4 sm:p-8 font-sans antialiased">
      <div className="max-w-7xl mx-auto bg-white rounded-xl shadow-2xl p-6 sm:p-12 border border-gray-100">
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
        {(showOverdueOnly ? overdueDebts.length : debts.length) >
          itemsPerPage && (
          <div className="flex justify-center items-center mt-8 space-x-2">
            <button
              onClick={handlePrevPage}
              disabled={currentPage === 1}
              className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
                currentPage === 1
                  ? "bg-gray-200 text-gray-500 cursor-not-allowed"
                  : "bg-blue-600 text-white hover:bg-blue-700"
              }`}
            >
              Previous
            </button>

            {/* Hides page buttons on mobile, shows on sm and larger */}
            <div className="hidden sm:flex space-x-2">
              {Array.from({ length: totalPages }, (_, i) => (
                <button
                  key={i + 1}
                  onClick={() => handlePageChange(i + 1)}
                  className={`w-10 h-10 rounded-full font-semibold transition-colors ${
                    currentPage === i + 1
                      ? "bg-blue-600 text-white shadow-lg"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  {i + 1}
                </button>
              ))}
            </div>

            {/* Shows a simple page counter on mobile */}
            <div className="sm:hidden text-center text-sm font-medium text-gray-700">
              Page {currentPage} of {totalPages}
            </div>

            <button
              onClick={handleNextPage}
              disabled={currentPage === totalPages}
              className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
                currentPage === totalPages
                  ? "bg-gray-200 text-gray-500 cursor-not-allowed"
                  : "bg-blue-600 text-white hover:bg-blue-700"
              }`}
            >
              Next
            </button>
          </div>
        )}
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
