import dotenv from "dotenv";
import crypto from "crypto";

import connectDB from "../config/db.js";

import processRazorpayWebhook
  from "./razorpayWebhookService.js";

dotenv.config();

const testWebhook = async () => {
  try {
    await connectDB();

    /*
    |--------------------------------------------------------------------------
    | Unique demo identifiers
    |--------------------------------------------------------------------------
    */

    const uniqueId =
      Date.now();

    const eventId =
      `evt_demo_agent_${uniqueId}`;

    const razorpayPaymentId =
      `pay_test_${uniqueId}`;

    const razorpayOrderId =
      `order_test_${uniqueId}`;

    /*
    |--------------------------------------------------------------------------
    | Fake Razorpay webhook payload
    |--------------------------------------------------------------------------
    */

    const payload = {
      entity: "event",

      account_id:
        "acc_demo_recoverai",

      event:
        "payment.failed",

      contains: [
        "payment"
      ],

      payload: {
        payment: {
          entity: {
            id:
              razorpayPaymentId,

            amount:
              4999,

            currency:
              "INR",

            status:
              "failed",

            order_id:
              razorpayOrderId,

            method:
              "card",

            email:
              "amit.singh@example.demo",

            error_code:
              "BANK_TEMPORARY_FAILURE",

            error_description:
              "Temporary bank-side payment failure",

            error_reason:
              "BANK_TEMPORARY_FAILURE"
          }
        }
      },

      created_at:
        Math.floor(
          Date.now() / 1000
        )
    };

    /*
    |--------------------------------------------------------------------------
    | Convert payload to RAW JSON
    |--------------------------------------------------------------------------
    */

    const rawBody =
      JSON.stringify(
        payload
      );

    /*
    |--------------------------------------------------------------------------
    | Generate Razorpay-style HMAC signature
    |--------------------------------------------------------------------------
    */

    const secret =
      process.env.RAZORPAY_WEBHOOK_SECRET;

    if (!secret) {
      throw new Error(
        "RAZORPAY_WEBHOOK_SECRET is missing from .env"
      );
    }

    const signature =
      crypto
        .createHmac(
          "sha256",
          secret
        )
        .update(rawBody)
        .digest("hex");

    /*
    |--------------------------------------------------------------------------
    | Send webhook into RecoverAI
    |--------------------------------------------------------------------------
    */

    const result =
      await processRazorpayWebhook({
        rawBody,

        signature,

        eventId
      });

    console.log(
      "\n===== RAZORPAY WEBHOOK TEST =====\n"
    );

    console.log(
      JSON.stringify(
        result,
        null,
        2
      )
    );

    /*
    |--------------------------------------------------------------------------
    | IMPORTANT
    |--------------------------------------------------------------------------
    |
    | The webhook intentionally starts the recovery orchestrator
    | asynchronously.
    |
    | Keep this test process alive long enough for the agent
    | workflow to finish.
    |
    */

    console.log(
      "\n⏳ Waiting for RecoverAI agent workflow..."
    );

    await new Promise(
      (resolve) =>
        setTimeout(
          resolve,
          15000
        )
    );

    console.log(
      "\n✅ Webhook test process finished."
    );

    console.log(
      "Check the recovery case in MongoDB or through the API."
    );

    console.log(
      "\n==================================\n"
    );

    await connectDB();

    process.exit(0);

  } catch (error) {
    console.error(
      "\nWebhook test failed:"
    );

    console.error(
      error.message
    );

    process.exit(1);
  }
};

testWebhook();