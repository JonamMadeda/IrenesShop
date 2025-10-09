"use client";

import { useState, useEffect } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { Loader2 } from "lucide-react";

import { auth, db } from "@/firebase/firebase.client";

export default function HomePage() {
  const [loading, setLoading] = useState(true);
  const [modalContent, setModalContent] = useState(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        window.location.href = "/auth";
        return;
      }

      try {
        const userDocRef = doc(db, "users", user.uid);
        const userDocSnap = await getDoc(userDocRef);

        // If no user doc exists → treat as new user
        if (!userDocSnap.exists()) {
          setModalContent({
            title: "Welcome!",
            message:
              "You don’t have an active subscription yet. Please go to billing to start your 14-day free trial.",
            buttonText: "Go to Billing",
            buttonAction: () => (window.location.href = "/billing"),
            isExpired: false,
          });
          return;
        }

        const userData = userDocSnap.data();
        const expiresAt = userData.expiresAt?.toDate();

        // Case 1: Expired
        if (expiresAt && expiresAt < new Date()) {
          await updateDoc(userDocRef, { subscriptionStatus: "inactive" });
          setModalContent({
            title: "Subscription Expired",
            message:
              "Your subscription has expired. Please go to the billing page to reactivate your account.",
            buttonText: "Go to Billing",
            buttonAction: () => (window.location.href = "/billing"),
            isExpired: true,
          });
        }
        // Case 2: Active subscription
        else if (userData.subscriptionStatus === "active") {
          window.location.href = "/dashboard";
        }
        // Case 3: No subscription info or inactive plan
        else {
          setModalContent({
            title: "Welcome!",
            message:
              "You don’t have an active subscription yet. Please go to billing to start your 14-day free trial.",
            buttonText: "Go to Billing",
            buttonAction: () => (window.location.href = "/billing"),
            isExpired: false,
          });
        }
      } catch (err) {
        console.error("Error checking subscription:", err);
        window.location.href = "/auth";
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  if (loading) {
    return (
      <main className="h-screen flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center">
          <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
          <p className="mt-4 text-gray-600 font-serif">
            Checking authentication...
          </p>
        </div>
      </main>
    );
  }

  if (modalContent) {
    return (
      // 👇 Key changes are here: fixed, inset-0 (or top-0 left-0), w-screen, h-screen, z-50
      <div className="fixed inset-0 w-screen h-screen flex items-center justify-center bg-gray-900 bg-opacity-75 z-50">
        <div className="flex flex-col items-center p-8 bg-white rounded-lg shadow-2xl text-center w-11/12 max-w-sm">
          <h2
            className={`text-2xl font-bold mb-4 font-sans ${
              modalContent.isExpired ? "text-red-600" : "text-green-600"
            }`}
          >
            {modalContent.title}
          </h2>
          <p className="text-gray-700 mb-6">{modalContent.message}</p>
          <button
            onClick={modalContent.buttonAction}
            className={`px-6 py-3 font-semibold rounded-full shadow-lg transition-colors ${
              modalContent.isExpired
                ? "bg-red-600 hover:bg-red-700 text-white"
                : "bg-green-600 hover:bg-green-700 text-white"
            }`}
          >
            {modalContent.buttonText}
          </button>
        </div>
      </div>
    );
  }

  return null;
}
