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

import { db, auth } from "@/firebase/firebase.client.js";

import DebtTable from "./_components/DebtTable";
import DebtForm from "./_components/DebtForm";
import ConfirmationModal from "./_components/ConfirmationModal";
import PageLoader from "@/app/components/PageLoader";

// Global variables provided by the environment
const initialAuthToken =
  typeof __initial_auth_token !== "undefined" ? __initial_auth_token : null;

const DebtTracker = () => {
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

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // 🔒 Subscription check and authentication
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
          window.location.href = "/";
          return;
        }
      }

      const currentUser = user || auth.currentUser;
      if (!currentUser) {
        console.log("No authenticated user found. Redirecting.");
        window.location.href = "/";
        return;
      }

      const userDocRef = doc(db, "users", currentUser.uid);
      const unsubscribeUser = onSnapshot(
        userDocRef,
        (docSnap) => {
          if (!docSnap.exists()) {
            console.log("User record not found. Redirecting.");
            window.location.href = "/";
            return;
          }

          const userData = docSnap.data();
          if (
            userData?.subscriptionStatus === "active" &&
            userData?.expiresAt?.toDate() > new Date()
          ) {
            setUserId(currentUser.uid);
            setIsAuthReady(true);
            setIsPageLoading(false);
          } else {
            console.log("Subscription expired or inactive. Redirecting.");
            window.location.href = "/";
          }
        },
        (err) => {
          console.error("Error checking subscription:", err);
          window.location.href = "/";
        }
      );

      return () => unsubscribeUser();
    });

    return () => unsubscribeAuth();
  }, []);

  // 🧾 Real-time listener for debts and items
  useEffect(() => {
    if (isAuthReady && userId) {
      const debtCollectionRef = collection(db, `users/${userId}/debts`);
      const itemsCollectionRef = collection(db, `users/${userId}/items`);

      const unsubscribeDebts = onSnapshot(
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
        },
        (error) => {
          console.error("Error fetching debts:", error);
          showStatus("error", "Failed to load debt records.");
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
        unsubscribeDebts();
        unsubscribeItems();
      };
    }
  }, [isAuthReady, userId]);

  // Utility: show status messages
  const showStatus = (type, message) => {
    setStatusMessage({ type, message });
    setTimeout(() => setStatusMessage({ type: "", message: "" }), 4000);
  };

  // 🧮 Form functions
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

  // 🗑️ Delete & Paid toggle
  const handleDelete = (id) => {
    setConfirmMessage(
      "Are you sure you want to delete this debt record? This action cannot be undone."
    );
    setConfirmAction(() => async () => {
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
          const docRef = doc(db, `users/${userId}/debts`, debt.id);
          await updateDoc(docRef, { isPaid: false });
          showStatus("success", "Debt marked as unpaid.");
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
          const salesCollectionRef = collection(db, `users/${userId}/sales`);
          const salesRecord = { ...debt, paidAt: serverTimestamp() };
          await addDoc(salesCollectionRef, salesRecord);

          const debtDocRef = doc(db, `users/${userId}/debts`, debt.id);
          await deleteDoc(debtDocRef);

          showStatus("success", "Debt paid and moved to sales successfully!");
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

  if (isPageLoading) return <PageLoader />;

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
