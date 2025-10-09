"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  getAuth, // Not needed, but keep imports for functions
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  onAuthStateChanged,
  signOut,
  updateProfile,
} from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import {
  Loader2,
  Mail,
  Lock,
  User,
  LogIn,
  UserPlus,
  LogOut,
  Eye,
  EyeOff,
} from "lucide-react";

// 👇 IMPORT FIREBASE SERVICES FROM THE NEW CLIENT FILE
import {
  auth,
  db,
  firebaseReady as initialFirebaseReady,
} from "@/firebase/firebase.client";

/**
 * A robust Firebase email/password authentication component.
 * Uses centralized Firebase config and supports login, signup, and logout with Firestore user profiles.
 */
export default function AuthPage() {
  // State for authentication and UI
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  // Set initial state from imported status
  const [firebaseReady, setFirebaseReady] = useState(initialFirebaseReady);
  const [error, setError] = useState(null);
  const [isLogin, setIsLogin] = useState(true);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordVisible, setPasswordVisible] = useState(false);
  // auth and db states are no longer necessary as they are imported directly.
  // We'll keep them out to simplify the component.

  useEffect(() => {
    // Check if Firebase services are available
    if (!auth || !db) {
      setError(
        "Failed to initialize Firebase services. Check your configuration."
      );
      setLoading(false);
      return;
    }

    // Listen for auth changes
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        console.log("User logged in:", currentUser.uid);
        if (window.location.pathname !== "/dashboard") {
          window.location.href = "/dashboard";
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []); // auth and db are now stable imports, so no need to include them as dependencies

  const togglePasswordVisibility = () => setPasswordVisible((prev) => !prev);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Services are imported, no need for the local check, but keep the early exit for safety
      if (!auth || !db) throw new Error("Firebase services not ready.");

      if (isLogin) {
        // Sign in user
        await signInWithEmailAndPassword(auth, email, password);
      } else {
        // Sign up new user
        if (password !== confirmPassword) {
          setError("Passwords do not match.");
          setLoading(false);
          return;
        }

        const userCredential = await createUserWithEmailAndPassword(
          auth,
          email,
          password
        );
        const newUser = userCredential.user;
        const fullName = `${firstName.trim()} ${lastName.trim()}`;
        if (fullName) await updateProfile(newUser, { displayName: fullName });

        await setDoc(doc(db, "users", newUser.uid), {
          firstName,
          lastName,
          email: newUser.email,
          createdAt: new Date(),
        });
        console.log("User created successfully.");
      }
    } catch (e) {
      console.error("Authentication error:", e.code, e.message);
      let message = "An unknown error occurred.";
      if (e.code === "auth/invalid-email") message = "Invalid email address.";
      else if (
        e.code === "auth/user-not-found" ||
        e.code === "auth/wrong-password"
      )
        message = "Incorrect email or password.";
      else if (e.code === "auth/email-already-in-use")
        message = "This email is already registered.";
      else if (e.code === "auth/weak-password")
        message = "Password must be at least 6 characters.";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    setLoading(true);
    try {
      await signOut(auth);
    } catch (e) {
      console.error("Sign out failed:", e);
      setError("Failed to sign out.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center p-8 bg-gray-100 min-h-screen font-sans">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="bg-white p-8 rounded-2xl shadow-2xl w-full max-w-sm border border-gray-200"
      >
        <div className="flex justify-center mb-6">
          <User className="w-16 h-16 text-blue-600" />
        </div>

        <h1 className="text-3xl font-bold text-gray-900 mb-6 text-center">
          {isLogin ? "Welcome Back" : "Create Account"}
        </h1>

        {loading || !firebaseReady ? (
          <div className="flex flex-col items-center py-8">
            <Loader2 className="w-10 h-10 text-blue-500 animate-spin" />
            <p className="mt-4 text-gray-600">{error || "Loading..."}</p>
          </div>
        ) : user ? (
          <div className="text-center">
            <h2 className="text-xl font-bold mt-4 text-gray-800">
              Welcome, {user.displayName || "User"}!
            </h2>
            <p className="text-gray-600 text-sm mt-2">{user.email}</p>
            <p className="mt-2 text-gray-700 text-sm break-all">
              Your User ID:{" "}
              <span className="font-mono text-gray-800 font-semibold">
                {user.uid}
              </span>
            </p>
            <button
              onClick={handleSignOut}
              className="mt-6 w-full flex justify-center items-center py-2 px-4 border border-transparent rounded-xl shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors"
            >
              <LogOut className="mr-2 h-5 w-5" /> Sign Out
            </button>
          </div>
        ) : (
          <>
            <p className="text-gray-700 text-center mb-6">
              Please {isLogin ? "sign in" : "sign up"} to continue.
            </p>
            <form onSubmit={handleSubmit} className="space-y-6">
              {!isLogin && (
                <>
                  <div>
                    <label htmlFor="firstName" className="sr-only">
                      First Name
                    </label>
                    <div className="relative rounded-xl shadow-sm">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <User className="h-5 w-5 text-gray-400" />
                      </div>
                      <input
                        type="text"
                        id="firstName"
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-xl placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                        placeholder="First Name"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="lastName" className="sr-only">
                      Last Name
                    </label>
                    <div className="relative rounded-xl shadow-sm">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <User className="h-5 w-5 text-gray-400" />
                      </div>
                      <input
                        type="text"
                        id="lastName"
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                        className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-xl placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                        placeholder="Last Name"
                        required
                      />
                    </div>
                  </div>
                </>
              )}

              <div>
                <label htmlFor="email" className="sr-only">
                  Email
                </label>
                <div className="relative rounded-xl shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="email"
                    id="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-xl placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    placeholder="Email address"
                    required
                  />
                </div>
              </div>

              <div>
                <label htmlFor="password" className="sr-only">
                  Password
                </label>
                <div className="relative rounded-xl shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type={passwordVisible ? "text" : "password"}
                    id="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="block w-full pl-10 pr-10 py-2 border border-gray-300 rounded-xl placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    placeholder="Password"
                    required
                  />
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                    <button
                      type="button"
                      onClick={togglePasswordVisibility}
                      className="text-gray-400 hover:text-gray-600 transition-colors"
                    >
                      {passwordVisible ? (
                        <EyeOff className="h-5 w-5" />
                      ) : (
                        <Eye className="h-5 w-5" />
                      )}
                    </button>
                  </div>
                </div>
              </div>

              {!isLogin && (
                <div>
                  <label htmlFor="confirmPassword" className="sr-only">
                    Confirm Password
                  </label>
                  <div className="relative rounded-xl shadow-sm">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Lock className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type={passwordVisible ? "text" : "password"}
                      id="confirmPassword"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="block w-full pl-10 pr-10 py-2 border border-gray-300 rounded-xl placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      placeholder="Confirm Password"
                      required
                    />
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                      <button
                        type="button"
                        onClick={togglePasswordVisibility}
                        className="text-gray-400 hover:text-gray-600 transition-colors"
                      >
                        {passwordVisible ? (
                          <EyeOff className="h-5 w-5" />
                        ) : (
                          <Eye className="h-5 w-5" />
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {error && (
                <p className="text-red-600 text-sm text-center font-medium">
                  {error}
                </p>
              )}

              <button
                type="submit"
                className="w-full flex justify-center items-center py-2 px-4 border border-transparent rounded-xl shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                disabled={loading}
              >
                {loading ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : isLogin ? (
                  <>
                    <LogIn className="mr-2 h-5 w-5" /> Sign In
                  </>
                ) : (
                  <>
                    <UserPlus className="mr-2 h-5 w-5" /> Sign Up
                  </>
                )}
              </button>
            </form>

            <div className="mt-6 text-center text-sm">
              <p className="text-gray-600">
                {isLogin
                  ? "Don't have an account?"
                  : "Already have an account?"}
                <button
                  onClick={() => setIsLogin(!isLogin)}
                  className="font-medium text-blue-600 hover:text-blue-500 ml-1 transition-colors"
                >
                  {isLogin ? "Sign up" : "Sign in"}
                </button>
              </p>
            </div>
          </>
        )}
      </motion.div>
    </div>
  );
}
