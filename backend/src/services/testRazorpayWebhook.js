import crypto from "crypto";
import dotenv from "dotenv";

import connectDB from "../config/db.js";

import processRazorpayWebhook
  from "./razorpayWebhookService.js";

dotenv.config();

const testWebhook = async () => {
  try {
    await connectDB();

    const payload = {
      entity: "event",

      account_id:
        "demo_account",

      event:
        "payment.failed",

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
              `pay_test_${Date.now()}`,

            amount:
              4999,

            currency:
              "INR",

            status:
              "failed",

            order_id:
              "order_test_123",

            method:
              "card",

            email:
              "amit.singh@example.demo",

            contact:
              "+919800000001",

            error_code:
              "BANK_TEMPORARY_FAILURE",

            error_description:
              "Temporary bank-side payment failure",

            error_reason:
              "temporary_issue"
          }
        }
      }
    };

    const rawBody =
      JSON.stringify(
        payload
      );

    const signature =
      crypto
        .createHmac(
          "sha256",
          process.env
            .RAZORPAY_WEBHOOK_SECRET
        )
        .update(rawBody)
        .digest("hex");

    // const eventId =
    //   `evt_test_${Date.now()}`;

    const eventId =
        "evt_test_idempotency_001";
      
    const paymentId =
        "pay_test_idempotency_001";

    const result =
      await processRazorpayWebhook({
        rawBody,

        signature,

        eventId,

        secret:
          process.env.RAZORPAY_WEBHOOK_SECRET
      });

    console.log(
      "\n===== RAZORPAY WEBHOOK TEST =====\n"
    );

    console.log(
      JSON.stringify(
        {
          duplicate:
            result.duplicate,

          eventType:
            result.eventType,

          paymentId:
            result.result?.payment?._id,

          recoveryCaseId:
            result.result
              ?.recoveryCase?._id,

          status:
            result.result
              ?.recoveryCase
              ?.status,

          riskScore:
            result.result
              ?.recoveryCase
              ?.riskScore
        },
        null,
        2
      )
    );

    console.log(
      "\n==================================\n"
    );

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