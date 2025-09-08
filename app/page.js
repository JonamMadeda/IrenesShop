"use client";

import { useState, useEffect } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { Loader2 } from "lucide-react";

import { auth, db } from "@/firebase/firebase.client";

/**
 * Handles user authentication and subscription status checks.
 * Redirects the user based on their authentication and plan status.
 */
export default function HomePage() {
  const [loading, setLoading] = useState(true);
  const [modalContent, setModalContent] = useState(null);

  useEffect(() => {
    // Listen for changes in the user's authentication state.
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      // If no user is authenticated, redirect to the login page.
      if (!user) {
        window.location.href = "/auth";
        return;
      }

      try {
        const userDocRef = doc(db, "users", user.uid);
        const userDocSnap = await getDoc(userDocRef);

        // If the user document doesn't exist, redirect to the login page.
        if (!userDocSnap.exists()) {
          window.location.href = "/auth";
          return;
        }

        const userData = userDocSnap.data();
        const expiresAt = userData.expiresAt?.toDate();

        // Case 1: Subscription has expired.
        if (expiresAt && expiresAt < new Date()) {
          // Update subscription status in Firestore to inactive.
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
        // Case 2: Subscription is active.
        else if (userData.subscriptionStatus === "active") {
          // Redirect to the main dashboard.
          window.location.href = "/dashboard";
        }
        // Case 3: New user or inactive plan.
        else {
          // Show a modal for new users to start a trial.
          setModalContent({
            title: "Welcome!",
            message:
              "You don't have an active plan yet. Head to the billing page to start your 14-day free trial.",
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

    // Cleanup the listener on component unmount.
    return () => unsubscribe();
  }, []);

  // Show a loading spinner while authentication is being checked.
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

  // Show a modal based on the subscription status.
  if (modalContent) {
    return (
      <main className="h-screen flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center p-8 bg-white rounded-lg shadow-xl text-center">
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
      </main>
    );
  }

  // This should not be reached in a typical flow, as a redirect or modal is expected.
  return null;
}
