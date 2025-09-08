import { NextResponse } from "next/server";
import { getAuth } from "firebase-admin/auth";
import { initializeApp, getApps, cert } from "firebase-admin/app";
import axios from "axios";

// This is where we import your Firebase Admin SDK credentials from the specified path.
import firebaseConfig from "@/firebase/firebase.config.js";

// Initialize Firebase Admin only once
if (!getApps().length) {
  initializeApp({
    credential: cert(firebaseConfig),
  });
}

const auth = getAuth();

// Paystack secret key from our .env.local file
const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY;

export async function POST(req) {
  try {
    const { uid, plan } = await req.json();

    if (!uid || !plan) {
      return NextResponse.json(
        { message: "Missing uid or plan." },
        { status: 400 }
      );
    }

    let amount;
    switch (plan) {
      case "standard":
        amount = 99900; // Paystack works in cents for KES (1 KES = 100 cents)
        break;
      case "pro":
        amount = 199900; // 1999 KES in cents
        break;
      case "elite":
        amount = 399900; // 3999 KES in cents
        break;
      default:
        return NextResponse.json(
          { message: "Invalid plan selected." },
          { status: 400 }
        );
    }

    // Make a secure API call to Paystack to initialize a transaction
    const paystackResponse = await axios.post(
      "https://api.paystack.co/transaction/initialize",
      {
        amount: amount,
        email: "test.user@example.com", // In a real app, use the user's email from Firebase
        currency: "KES",
        // 👈 ADD THIS LINE
        callback_url: `${process.env.NEXT_PUBLIC_BASE_URL}/api/verify-payment?uid=${uid}&plan=${plan}`,
      },
      {
        headers: {
          Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );

    // Send the secure authorization URL back to the client
    return NextResponse.json({
      authorizationUrl: paystackResponse.data.data.authorization_url,
    });
  } catch (error) {
    console.error(
      "Paystack initialization error:",
      error.response ? error.response.data : error.message
    );
    return NextResponse.json(
      { message: "Failed to initialize payment.", error: error.message },
      { status: 500 }
    );
  }
}
