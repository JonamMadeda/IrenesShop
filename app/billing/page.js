"use client";

import React, { useState, useEffect } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { onSnapshot, doc, getDoc, setDoc, updateDoc } from "firebase/firestore";
import { Check } from "lucide-react";
import { db, auth } from "@/firebase/firebase.client.js";
import PageLoader from "@/app/components/PageLoader";

const PricingCard = ({
  planName,
  price,
  originalPrice,
  features,
  currentPlan,
  canStartTrial,
  handleSubscribe,
  handleFreeTrial,
}) => {
  const isCurrentPlan = currentPlan === planName;
  const isComingSoon = planName === "pro" || planName === "elite";
  const isStandardPlan = planName === "standard";

  const isDisabled = isCurrentPlan || isComingSoon;

  const buttonText = isComingSoon
    ? "Coming Soon"
    : isCurrentPlan
    ? "Current Plan"
    : canStartTrial && isStandardPlan
    ? "Start 14-Day Free Trial"
    : "Subscribe Now";

  const borderColorClass =
    {
      standard: "border-blue-500",
      pro: "border-gray-300",
      elite: "border-gray-300",
    }[planName] || "border-gray-200";

  const buttonColorClass =
    {
      standard: "bg-blue-600 hover:bg-blue-700",
      pro: "bg-gray-400",
      elite: "bg-gray-400",
    }[planName] || "bg-gray-600 hover:bg-gray-700";

  const textColorClass =
    {
      standard: "text-blue-600",
      pro: "text-gray-500",
      elite: "text-gray-500",
    }[planName] || "text-gray-900";

  const opacityClass = isComingSoon ? "opacity-50" : "";

  const handleButtonClick = () => {
    if (canStartTrial && isStandardPlan) {
      handleFreeTrial();
    } else {
      handleSubscribe(planName, price);
    }
  };

  return (
    <div
      className={`bg-white border-2 ${borderColorClass} rounded-xl shadow-lg p-8 flex flex-col justify-between transform transition-transform duration-300 relative ${opacityClass}`}
    >
      {isStandardPlan && canStartTrial && (
        <div className="absolute top-4 right-4 bg-green-500 text-white text-xs font-bold uppercase py-1.5 px-3 rounded-full shadow-lg">
          Free Trial
        </div>
      )}
      {isCurrentPlan && (
        <div className="absolute top-4 right-4 bg-orange-500 text-white text-xs font-bold uppercase py-1.5 px-3 rounded-full shadow-lg">
          Active
        </div>
      )}
      {isComingSoon && (
        <div className="absolute top-4 right-4 bg-gray-500 text-white text-xs font-bold uppercase py-1.5 px-3 rounded-full shadow-lg">
          Coming Soon
        </div>
      )}
      <div className="text-center mt-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-2">
          {planName.charAt(0).toUpperCase() + planName.slice(1)} Plan
        </h2>
        {isStandardPlan && originalPrice && (
          <p className="text-xl font-medium text-gray-400 line-through">
            KES {originalPrice}
          </p>
        )}
        <p className={`text-5xl font-bold mb-6 ${textColorClass}`}>
          KES {price}
          <span className="text-sm font-medium text-gray-500"> / month</span>
        </p>
      </div>
      <ul className="space-y-4 mb-8 text-left text-gray-700 flex-grow">
        {features.map((feature, index) => (
          <li key={index} className="flex items-center space-x-3">
            <Check className="flex-shrink-0 w-5 h-5 text-green-500" />
            <span>{feature}</span>
          </li>
        ))}
      </ul>
      <div className="mt-auto">
        <button
          onClick={handleButtonClick}
          disabled={isDisabled}
          className={`w-full py-4 px-6 rounded-lg text-white font-semibold shadow-lg transition-all duration-300 transform ${
            isComingSoon ? "bg-gray-400 cursor-not-allowed" : buttonColorClass
          } ${
            isDisabled && !isComingSoon ? "opacity-50 cursor-not-allowed" : ""
          }`}
        >
          {buttonText}
        </button>
      </div>
    </div>
  );
};

const Billing = () => {
  const [user, setUser] = useState(null);
  const [currentPlan, setCurrentPlan] = useState(null);
  const [hasTrialBeenUsed, setHasTrialBeenUsed] = useState(false);
  const [daysRemaining, setDaysRemaining] = useState(null);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);

  const plans = {
    standard: {
      price: 499,
      originalPrice: 999,
      features: [
        "Unlimited Stock Management",
        "Comprehensive Reports",
        "Priority Support",
      ],
    },
    pro: {
      price: 1499,
      features: [
        "Unlimited Stock Management",
        "Comprehensive Reports",
        "Priority Support",
        "Advanced Analytics",
        "Customizable Dashboards",
      ],
    },
    elite: {
      price: 3499,
      features: [
        "Unlimited Stock Management",
        "Comprehensive Reports",
        "Priority Support",
        "Advanced Analytics",
        "Customizable Dashboards",
        "AI-Powered Forecasting",
        "Dedicated Account Manager",
      ],
    },
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        const userRef = doc(db, "users", currentUser.uid);
        const unsubscribeSnapshot = onSnapshot(
          userRef,
          (docSnap) => {
            if (docSnap.exists()) {
              const userData = docSnap.data();
              setHasTrialBeenUsed(userData.trialUsed || false);

              if (userData.subscriptionStatus === "active") {
                setCurrentPlan(userData.plan);
                const expiresAt = userData.expiresAt.toDate();
                const now = new Date();
                const timeDiff = expiresAt.getTime() - now.getTime();
                const daysLeft = Math.floor(timeDiff / (1000 * 60 * 60 * 24));
                setDaysRemaining(daysLeft > 0 ? daysLeft : 0);
              } else {
                setCurrentPlan(null);
                setDaysRemaining(null);
              }
            } else {
              setHasTrialBeenUsed(false);
              setCurrentPlan(null);
              setDaysRemaining(null);
            }
            setIsLoading(false);
            setError("");
          },
          (err) => {
            console.error("Failed to listen for user data:", err);
            setError("Failed to load subscription status.");
            setIsLoading(false);
          }
        );
        return () => unsubscribeSnapshot();
      } else {
        setCurrentPlan(null);
        setIsLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  const handleFreeTrial = async () => {
    if (!user) {
      setError("Please sign in to start your free trial.");
      return;
    }

    if (hasTrialBeenUsed) {
      setError("You have already used your free trial.");
      return;
    }

    setIsProcessing(true);
    setError("");

    try {
      const userDocRef = doc(db, "users", user.uid);
      const userDocSnap = await getDoc(userDocRef);

      const trialExpiryDate = new Date();
      trialExpiryDate.setDate(trialExpiryDate.getDate() + 14);

      const trialData = {
        plan: "standard",
        subscriptionStatus: "active",
        expiresAt: trialExpiryDate,
        isTrial: true,
        trialUsed: true,
      };

      if (userDocSnap.exists()) {
        await updateDoc(userDocRef, trialData);
      } else {
        await setDoc(userDocRef, {
          ...trialData,
          createdAt: new Date(),
        });
      }

      window.location.href = "/dashboard";
    } catch (err) {
      console.error("Failed to start free trial:", err);
      setError("Failed to start free trial. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSubscribe = async (planName, price) => {
    if (!user) {
      setError("Please sign in to subscribe.");
      return;
    }

    if (isProcessing) return;

    setIsProcessing(true);
    setError("");

    try {
      const response = await fetch("/api/create-paystack-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          uid: user.uid,
          email: user.email,
          plan: planName,
          amount: price * 100, // Paystack requires lowest currency unit
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to create checkout session.");
      }

      const authUrl =
        data.authorizationUrl || data.authorization_url || data.authUrl;

      if (authUrl) {
        window.location.href = authUrl;
      } else {
        throw new Error("Invalid response from payment service.");
      }
    } catch (err) {
      console.error("Paystack checkout failed:", err);
      setError("Payment processing failed. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  const canStartTrial = !currentPlan && !hasTrialBeenUsed;

  return (
    <>
      {(isLoading || isProcessing) && <PageLoader />}
      <div className="min-h-[90svh] bg-gray-50 flex items-center justify-center p-6 sm:p-8 font-sans">
        <div className="w-full max-w-6xl">
          <div className="text-center mb-14">
            <h1 className="text-5xl font-bold text-gray-900 tracking-tight mb-2">
              Billing
            </h1>
            <p className="text-xl text-gray-600">
              Choose a plan that fits your business needs.
            </p>
            {currentPlan && (
              <p className="mt-4 text-green-600 font-semibold text-lg">
                You are currently subscribed to the{" "}
                {currentPlan.charAt(0).toUpperCase() + currentPlan.slice(1)}{" "}
                Plan.
              </p>
            )}
            {currentPlan && daysRemaining !== null && (
              <p className="mt-2 text-gray-500 text-sm">
                Your subscription expires in {daysRemaining} days.
              </p>
            )}
            {canStartTrial && (
              <p className="mt-4 text-blue-600 font-semibold text-lg">
                Start your 14-day free trial today!
              </p>
            )}
            {error && (
              <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-700 text-sm font-medium">{error}</p>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 sm:gap-12">
            {Object.entries(plans).map(([planName, planDetails]) => (
              <PricingCard
                key={planName}
                planName={planName}
                price={planDetails.price}
                originalPrice={planDetails.originalPrice}
                features={planDetails.features}
                currentPlan={currentPlan}
                canStartTrial={canStartTrial && !isProcessing}
                handleSubscribe={handleSubscribe}
                handleFreeTrial={handleFreeTrial}
              />
            ))}
          </div>
        </div>
      </div>
    </>
  );
};

export default Billing;
