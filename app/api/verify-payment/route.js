import { NextResponse } from "next/server";
import axios from "axios";
import { initializeApp, getApps, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import firebaseConfig from "@/firebase/firebase.config.js";

// Init Firebase Admin
if (!getApps().length) {
  initializeApp({
    credential: cert(firebaseConfig),
  });
}
const db = getFirestore();

const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY;

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const reference = searchParams.get("reference");
    const uid = searchParams.get("uid");
    const plan = searchParams.get("plan");

    if (!reference || !uid || !plan) {
      console.error("Missing required params:", { reference, uid, plan });
      return NextResponse.redirect(
        new URL("/dashboard?paymentError=missing", req.url)
      );
    }

    // Verify transaction
    const paystackResponse = await axios.get(
      `https://api.paystack.co/transaction/verify/${reference}`,
      {
        headers: {
          Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
        },
      }
    );

    const transactionData = paystackResponse.data.data;
    console.log("Paystack verify response:", transactionData);

    if (transactionData.status === "success") {
      // Save payment record
      const paymentRef = db.collection("users").doc(uid).collection("payments");
      await paymentRef.add({
        reference: transactionData.reference,
        amount: transactionData.amount / 100, // convert kobo to KES
        currency: transactionData.currency,
        status: transactionData.status,
        plan,
        paidAt: new Date(),
      });
      console.log("Payment record added to Firestore for user:", uid);

      // Update subscription status
      const userRef = db.collection("users").doc(uid);
      await userRef.set(
        {
          subscriptionStatus: "active",
          plan,
          expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
        },
        { merge: true }
      );
      console.log("Subscription updated for user:", uid);

      // Redirect to dashboard
      return NextResponse.redirect(new URL("/dashboard", req.url));
    } else {
      console.error("Payment not successful:", transactionData);
      return NextResponse.redirect(
        new URL("/dashboard?paymentStatus=failed", req.url)
      );
    }
  } catch (error) {
    console.error(
      "Payment verification error:",
      error.response ? error.response.data : error.message
    );
    return NextResponse.redirect(
      new URL("/dashboard?paymentError=verification_failed", req.url)
    );
  }
}
