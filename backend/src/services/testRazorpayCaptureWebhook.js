import crypto from "crypto";
import dotenv from "dotenv";

import connectDB from "../config/db.js";

import processRazorpayWebhook
  from "./razorpayWebhookService.js";

import Payment from "../models/Payment.js";

dotenv.config();

const testCaptureWebhook = async () => {
  try {
    await connectDB();

    /*
    |--------------------------------------------------------------------------
    | Find the latest non-simulation payment
    |--------------------------------------------------------------------------
    */

    const payment =
      await Payment.findOne({
        isSimulation: false
      }).sort({
        createdAt: -1
      });

    if (!payment) {
      throw new Error(
        "No webhook-created payment found."
      );
    }

    const razorpayPaymentId =
      payment.razorpayPaymentId;

    const eventId =
      "evt_test_capture_001";

    /*
    |--------------------------------------------------------------------------
    | Construct payment.captured payload
    |--------------------------------------------------------------------------
    */

    const payload = {
      entity: "event",

      account_id:
        "demo_account",

      event:
        "payment.captured",

      contains: [
        "payment"
      ],

      created_at:
        Math.floor(
          Date.now() / 1000
        ),

      payload: {
        payment: {
          entity: {
            id:
              razorpayPaymentId,

            amount:
              payment.amount,

            currency:
              payment.currency || "INR",

            status:
              "captured",

            order_id:
              payment.razorpayOrderId,

            method:
              payment.method,

            email:
              "amit.singh@example.demo"
          }
        }
      }
    };

    const rawBody =
      JSON.stringify(
        payload
      );

    /*
    |--------------------------------------------------------------------------
    | Generate valid webhook signature
    |--------------------------------------------------------------------------
    */

    const signature =
      crypto
        .createHmac(
          "sha256",
          process.env
            .RAZORPAY_WEBHOOK_SECRET
        )
        .update(rawBody)
        .digest("hex");

    /*
    |--------------------------------------------------------------------------
    | Send through our actual webhook service
    |--------------------------------------------------------------------------
    */

    const result =
      await processRazorpayWebhook({
        rawBody,

        signature,

        eventId,

        secret:
          process.env
            .RAZORPAY_WEBHOOK_SECRET
      });

    console.log(
      "\n===== RAZORPAY CAPTURE WEBHOOK TEST =====\n"
    );

    console.log(
      JSON.stringify(
        {
          duplicate:
            result.duplicate,

          eventType:
            result.eventType,

          razorpayPaymentId,

          paymentStatus:
            result.result?.payment?.status,

          recoveryCaseStatus:
            result.result?.recoveryCase?.status,

          amountRecovered:
            result.result?.recoveryCase
              ?.amountRecovered
        },
        null,
        2
      )
    );

    console.log(
      "\n==========================================\n"
    );

    process.exit(0);

  } catch (error) {
    console.error(
      "\nCapture webhook test failed:"
    );

    console.error(
      error.message
    );

    process.exit(1);
  }
};

testCaptureWebhook();