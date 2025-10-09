import { NextResponse } from "next/server";
import axios from "axios";

// Define plan amounts (KES × 100 because Paystack expects the lowest currency unit)
const PLAN_AMOUNTS = {
  standard: 29900, // KES 299
  pro: 59900, // KES 599
  elite: 259900, // KES 2599
};

export async function POST(req) {
  try {
    const { uid, plan, email } = await req.json();

    // Validate required fields
    if (!uid || !plan || !email) {
      return NextResponse.json(
        { message: "Missing required fields: uid, plan, or email" },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { message: "Invalid email format" },
        { status: 400 }
      );
    }

    // Get amount for plan
    const amount = PLAN_AMOUNTS[plan];
    if (!amount) {
      return NextResponse.json(
        {
          message: `Invalid plan selected: ${plan}. Available: ${Object.keys(
            PLAN_AMOUNTS
          ).join(", ")}`,
        },
        { status: 400 }
      );
    }

    console.log(
      `Initializing payment: Plan=${plan}, Amount=${amount} (KES ${
        amount / 100
      }), Email=${email}`
    );

    // Initialize Paystack transaction
    const response = await axios.post(
      "https://api.paystack.co/transaction/initialize",
      {
        email,
        amount,
        currency: "KES",
        callback_url: `${process.env.NEXT_PUBLIC_BASE_URL}/api/verify-payment?uid=${uid}&plan=${plan}`,
        metadata: {
          uid: uid,
          plan_name: plan,
          custom_fields: [
            {
              display_name: "User ID",
              variable_name: "user_id",
              value: uid,
            },
          ],
        },
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );

    if (!response.data.status) {
      console.error("Paystack API Error:", response.data);
      return NextResponse.json(
        { message: response.data.message || "Payment initialization failed" },
        { status: 400 }
      );
    }

    console.log(
      "Payment initialized successfully:",
      response.data.data.reference
    );

    return NextResponse.json({
      status: true,
      authorizationUrl: response.data.data.authorization_url,
      reference: response.data.data.reference,
      access_code: response.data.data.access_code,
    });
  } catch (error) {
    console.error(
      "Paystack Init Error:",
      error.response?.data || error.message
    );

    if (error.response?.data) {
      const paystackError = error.response.data;

      if (paystackError.code === "invalid_amount") {
        return NextResponse.json(
          {
            message:
              "Invalid amount. Please check your plan configuration in your API code.",
          },
          { status: 400 }
        );
      }

      return NextResponse.json(
        {
          message: paystackError.message || "Payment initialization failed",
          error_code: paystackError.code,
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { message: "Internal server error. Please try again later." },
      { status: 500 }
    );
  }
}
