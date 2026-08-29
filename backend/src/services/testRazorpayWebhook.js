import dotenv from "dotenv";
import crypto from "crypto";

import connectDB from "../config/db.js";

import processRazorpayWebhook
  from "./razorpayWebhookService.js";

dotenv.config();

/*
|--------------------------------------------------------------------------
| Razorpay Webhook Test
|--------------------------------------------------------------------------
|
| This test:
|
| 1. Creates a realistic payment.failed payload.
| 2. Generates a valid HMAC signature.
| 3. Sends it into the actual webhook service.
| 4. Uses unique event/payment/order IDs on every run.
| 5. Keeps the Node process alive so the asynchronous
|    RecoverAI agent can finish.
|
|--------------------------------------------------------------------------
*/

const testWebhook = async () => {
  try {
    await connectDB();

    /*
     |--------------------------------------------------------------------------
     | Unique IDs
     |--------------------------------------------------------------------------
     */

    const uniqueId =
      Date.now();

    const eventId =
      `evt_demo_${uniqueId}`;

    const paymentId =
      `pay_test_${uniqueId}`;

    const orderId =
      `order_test_${uniqueId}`;

    /*
     |--------------------------------------------------------------------------
     | Simulated Razorpay payment.failed payload
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
              paymentId,

            entity:
              "payment",

            amount:
              4999,

            currency:
              "INR",

            status:
              "failed",

            order_id:
              orderId,

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
     | RAW BODY
     |--------------------------------------------------------------------------
     */

    const rawBody =
      JSON.stringify(
        payload
      );

    /*
     |--------------------------------------------------------------------------
     | Webhook Secret
     |--------------------------------------------------------------------------
     */

    const secret =
      process.env.RAZORPAY_WEBHOOK_SECRET;

    if (!secret) {
      throw new Error(
        "RAZORPAY_WEBHOOK_SECRET is missing from .env"
      );
    }

    /*
     |--------------------------------------------------------------------------
     | Generate valid HMAC SHA-256 signature
     |--------------------------------------------------------------------------
     */

    const signature =
      crypto
        .createHmac(
          "sha256",
          secret
        )
        .update(rawBody)
        .digest("hex");

    console.log(
      "\n===== RAZORPAY WEBHOOK TEST =====\n"
    );

    console.log(
      "Event ID:",
      eventId
    );

    console.log(
      "Payment ID:",
      paymentId
    );

    console.log(
      "Customer:",
      "amit.singh@example.demo"
    );

    /*
     |--------------------------------------------------------------------------
     | Send webhook into the actual service
     |--------------------------------------------------------------------------
     */

    const result =
      await processRazorpayWebhook({
        rawBody,

        signature,

        eventId,

        /*
         * Explicitly passing the same secret makes the test
         * compatible with the existing webhook controller/service.
         */

        secret
      });

    /*
     |--------------------------------------------------------------------------
     | Print only useful result information
     |--------------------------------------------------------------------------
     */

    console.log(
      "\nWebhook Result:"
    );

    console.log(
      JSON.stringify(
        {
          duplicate:
            result.duplicate,

          eventId:
            result.eventId,

          eventType:
            result.eventType,

          paymentId:
            result.result?.payment?._id ||
            result.result?.payment?.id ||
            null,

          recoveryCaseId:
            result.result?.recoveryCase?._id ||
            null,

          status:
            result.result?.recoveryCase?.status ||
            null
        },
        null,
        2
      )
    );

    /*
     |--------------------------------------------------------------------------
     | Wait for asynchronous RecoverAI agent
     |--------------------------------------------------------------------------
     |
     | The webhook itself intentionally returns before Gemini/policy/action
     | processing is complete.
     |
     * Give the background agent enough time to finish in local development.
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
      "\n✅ Webhook test finished."
    );

    console.log(
      "The webhook event was accepted and the RecoverAI agent was started."
    );

    console.log(
      "\n==================================\n"
    );

    process.exit(0);
  } catch (error) {
    console.error(
      "\n❌ Webhook test failed:\n"
    );

    console.error(
      error.message
    );

    console.error(
      "\n==================================\n"
    );

    process.exit(1);
  }
};

testWebhook();