"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { createClient } from "@/utils/supabase/client";
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
  AlertTriangle,
} from "lucide-react";

export default function AuthPage() {
  const supabase = createClient();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isLogin, setIsLogin] = useState(true);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);

  useEffect(() => {
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { error: userRowError } = await supabase.from("users").upsert({
          id: user.id,
          updated_at: new Date().toISOString(),
        });

        if (userRowError) {
          throw userRowError;
        }

        setUser(user);
        setShowAuthModal(false);
        if (window.location.pathname !== "/dashboard") {
          window.location.href = "/dashboard";
        }
      } else {
        setShowAuthModal(true);
        setUser(null);
      }
      setLoading(false);
    };

    checkUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_IN' && session?.user) {
          setUser(session.user);
          setShowAuthModal(false);
          window.location.href = "/dashboard";
        } else if (event === 'SIGNED_OUT') {
          setUser(null);
          setShowAuthModal(true);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, [supabase]);

  const togglePasswordVisibility = () => setPasswordVisible((prev) => !prev);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (isLogin) {
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (signInError) throw signInError;
      } else {
        if (password !== confirmPassword) {
          setError("Passwords do not match.");
          setLoading(false);
          return;
        }

        const { data: { user: newUser }, error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              first_name: firstName,
              last_name: lastName,
              display_name: `${firstName} ${lastName}`.trim(),
            }
          }
        });

        if (signUpError) throw signUpError;

        if (newUser) {
          const { error: dbError } = await supabase.from("users").upsert({
            id: newUser.id,
            role: "staff",
            updated_at: new Date().toISOString(),
          });
          if (dbError) console.error("Database upsert error:", dbError);
        }
        console.log("User created successfully.");
      }
    } catch (e) {
      console.error("Authentication error:", e.code, e.message);
      setError(e.message || "An unknown error occurred.");
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    setLoading(true);
    try {
      const { error: signOutError } = await supabase.auth.signOut();
      if (signOutError) throw signOutError;
      setUser(null);
      setShowAuthModal(true);
    } catch (e) {
      console.error("Sign out failed:", e);
      setError("Failed to sign out.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 font-sans">
      {/* Auth Modal */}
      <AnimatePresence>
        {showAuthModal && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          >
            <motion.div
              initial={{ y: 40, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 40, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="bg-white p-6 sm:p-8 rounded-2xl shadow-2xl w-full max-w-sm border border-gray-200 relative"
            >
              <button
                className="absolute top-3 right-4 text-gray-400 hover:text-gray-600"
                onClick={() => setShowAuthModal(false)}
              >
                ✕
              </button>

              <div className="flex flex-col items-center mb-4">
                <AlertTriangle className="w-12 h-12 text-yellow-500 mb-2" />
                <h2 className="text-xl font-bold text-gray-800">
                  Authentication Required
                </h2>
                <p className="text-gray-600 text-sm text-center mt-1">
                  Please sign in or create an account to continue.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5 mt-4">
                {!isLogin && (
                  <>
                    <input
                      type="text"
                      placeholder="First Name"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      className="w-full border border-gray-300 rounded-xl px-4 py-2 focus:ring-blue-500 focus:border-blue-500"
                      required
                    />
                    <input
                      type="text"
                      placeholder="Last Name"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      className="w-full border border-gray-300 rounded-xl px-4 py-2 focus:ring-blue-500 focus:border-blue-500"
                      required
                    />
                  </>
                )}

                <input
                  type="email"
                  placeholder="Email Address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full border border-gray-300 rounded-xl px-4 py-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                />

                <div className="relative">
                  <input
                    type={passwordVisible ? "text" : "password"}
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full border border-gray-300 rounded-xl px-4 py-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                  <button
                    type="button"
                    onClick={togglePasswordVisibility}
                    className="absolute right-3 top-2 text-gray-400 hover:text-gray-600"
                  >
                    {passwordVisible ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>

                {!isLogin && (
                  <input
                    type={passwordVisible ? "text" : "password"}
                    placeholder="Confirm Password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full border border-gray-300 rounded-xl px-4 py-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                )}

                {error && (
                  <p className="text-red-600 text-sm text-center">{error}</p>
                )}

                <button
                  type="submit"
                  className="w-full bg-blue-600 text-white py-2 rounded-xl font-medium hover:bg-blue-700 transition-all"
                  disabled={loading}
                >
                  {loading ? (
                    <Loader2 className="w-5 h-5 mx-auto animate-spin" />
                  ) : isLogin ? (
                    <>
                      <LogIn className="inline-block mr-1 h-4 w-4" /> Sign In
                    </>
                  ) : (
                    <>
                      <UserPlus className="inline-block mr-1 h-4 w-4" /> Sign Up
                    </>
                  )}
                </button>
              </form>

              <div className="text-center mt-4 text-sm">
                <p className="text-gray-600">
                  {isLogin ? "Don't have an account?" : "Already registered?"}
                  <button
                    onClick={() => setIsLogin(!isLogin)}
                    className="text-blue-600 font-medium ml-1 hover:underline"
                  >
                    {isLogin ? "Sign up" : "Sign in"}
                  </button>
                </p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Logged in view */}
      {!showAuthModal && user && (
        <div className="text-center bg-white p-8 rounded-2xl shadow-md">
          <h2 className="text-xl font-bold text-gray-800 mb-2">
            Welcome, {user.user_metadata?.display_name || user.user_metadata?.full_name || "User"}!
          </h2>
          <p className="text-gray-600">{user.email}</p>
          <button
            onClick={handleSignOut}
            className="mt-6 bg-red-600 text-white px-6 py-2 rounded-xl hover:bg-red-700 transition-all flex items-center mx-auto"
          >
            <LogOut className="mr-2 h-5 w-5" /> Sign Out
          </button>
        </div>
      )}
    </div>
  );
}
