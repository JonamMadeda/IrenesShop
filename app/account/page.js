"use client";

import React, { useState, useEffect } from "react";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";

// Using the pre-initialized Firebase services from the shared file.
import { db, auth } from "@/firebase/firebase.client.js";
import PageLoader from "../components/PageLoader";

const AccountPage = () => {
  // State for user data, loading status, and any errors.
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [displayName, setDisplayName] = useState(null);

  useEffect(() => {
    // This listener handles the initial authentication state and subsequent changes.
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        // Update state with the authenticated user's display name.
        setDisplayName(user.displayName);

        // Fetch user profile data from Firestore.
        const userId = user.uid;
        try {
          const userDocRef = doc(db, "users", userId);
          const docSnap = await getDoc(userDocRef);

          if (docSnap.exists()) {
            setUserProfile(docSnap.data());
          } else {
            console.warn("No user profile found in Firestore.");
            setUserProfile({
              firstName: "N/A",
              lastName: "N/A",
              phoneNumber: "N/A",
            });
          }
        } catch (e) {
          setError("Failed to fetch user data. Please try again.");
          console.error("Error fetching document: ", e);
        } finally {
          setLoading(false);
        }
      } else {
        // No user is signed in. Redirect to the login page.
        window.location.href = "/auth";
      }
    });

    return () => unsubscribe();
  }, []);

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (e) {
      setError("Failed to log out. Please try again.");
      console.error("Error signing out: ", e);
    }
  };

  if (loading) {
    return <PageLoader />;
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50 font-sans">
        <p className="text-red-500 font-medium">{error}</p>
      </div>
    );
  }

  return (
    <div className="min-h-[90svh] bg-gray-50 flex items-center justify-center p-4 font-sans">
      <div className="w-full max-w-2xl mx-auto bg-white rounded-2xl shadow-xl p-8 sm:p-12 border border-gray-200">
        <h1 className="text-4xl sm:text-4xl font-bold text-center text-gray-900 mb-2 tracking-tight">
          My Account
        </h1>

        {displayName && (
          <p className="text-center text-lg text-gray-600 mb-8">
            Welcome, <span className="font-semibold">{displayName}!</span>
          </p>
        )}

        {/* Contact Support Card */}
        <div className="bg-gray-100 rounded-xl p-6 sm:p-8 shadow-inner border border-gray-200">
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-800 text-center">
              Contact Support
            </h2>
            <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
              <a
                href="tel:+254703111438"
                className="w-full text-center flex items-center justify-center px-6 py-3 rounded-xl font-bold text-sm text-white transition-all duration-300 transform bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-4 focus:ring-blue-300 active:scale-95 shadow-md"
              >
                Call Support
              </a>
              <a
                href="https://wa.me/254703111438"
                className="w-full text-center flex items-center justify-center px-6 py-3 rounded-xl font-bold text-sm text-white transition-all duration-300 transform bg-green-700 hover:bg-green-600 focus:outline-none focus:ring-4 focus:ring-green-300 active:scale-95 shadow-md"
              >
                WhatsApp
              </a>
              <a
                href="sms:+254703111438"
                className="w-full text-center flex items-center justify-center px-6 py-3 rounded-xl font-bold text-sm text-white transition-all duration-300 transform bg-gray-700 hover:bg-gray-800 focus:outline-none focus:ring-4 focus:ring-purple-300 active:scale-95 shadow-md"
              >
                Send an SMS
              </a>
            </div>
          </div>
        </div>

        {/* Logout Button */}
        <div className="mt-8">
          <button
            onClick={handleLogout}
            className="w-full px-8 py-4 rounded-xl font-bold text-base text-white transition-all duration-300 transform bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-4 focus:ring-red-300 active:scale-95 shadow-md"
          >
            Log Out
          </button>
        </div>
      </div>
    </div>
  );
};

export default AccountPage;
