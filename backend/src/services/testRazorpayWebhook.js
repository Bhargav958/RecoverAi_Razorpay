import dotenv from "dotenv";
import crypto from "crypto";
import mongoose from "mongoose";

import connectDB from "../config/db.js";

import RecoveryCase from "../models/RecoveryCase.js";

import processRazorpayWebhook
  from "./razorpayWebhookService.js";

dotenv.config();

/*
|--------------------------------------------------------------------------
| RecoverAI Razorpay Webhook Integration Test
|--------------------------------------------------------------------------
|
| IMPORTANT:
|
| The webhook starts the recovery orchestrator asynchronously.
| Therefore this test MUST keep the MongoDB connection alive
| until the background workflow has completed.
|
|--------------------------------------------------------------------------
*/

const sleep = (ms) =>
  new Promise((resolve) =>
    setTimeout(resolve, ms)
  );

/*
|--------------------------------------------------------------------------
| States that mean the workflow is still running
|--------------------------------------------------------------------------
*/

const ACTIVE_STATES = [
  "DETECTED",
  "ANALYZING",
  "PENDING_ACTION",
  "ACTION_SELECTED",
  "ACTION_SCHEDULED"
];

const testWebhook = async () => {
  try {
    await connectDB();

    console.log(
      "\n===== RAZORPAY WEBHOOK TEST =====\n"
    );

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
    | Razorpay-style payment.failed event
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
    | Raw body
    |--------------------------------------------------------------------------
    */

    const rawBody =
      JSON.stringify(
        payload
      );

    /*
    |--------------------------------------------------------------------------
    | Webhook secret
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
    | Generate HMAC SHA-256 signature
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

    /*
    |--------------------------------------------------------------------------
    | Send webhook through actual service
    |--------------------------------------------------------------------------
    */

    const result =
      await processRazorpayWebhook({
        rawBody,

        signature,

        eventId,

        secret
      });

    /*
    |--------------------------------------------------------------------------
    | Get RecoveryCase ID
    |--------------------------------------------------------------------------
    */

    const recoveryCaseId =
      result?.result?.recoveryCase?._id;

    if (!recoveryCaseId) {
      throw new Error(
        "Webhook did not return a recoveryCaseId."
      );
    }

    const caseId =
      recoveryCaseId.toString();

    /*
    |--------------------------------------------------------------------------
    | Webhook response
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

          recoveryCaseId:
            caseId,

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
    | Poll the RecoveryCase
    |--------------------------------------------------------------------------
    |
    | IMPORTANT:
    |
    | DETECTED is NOT finished.
    |
    | The asynchronous agent may take several seconds to move
    | the case:
    |
    | DETECTED
    |    ↓
    | ANALYZING
    |    ↓
    | PENDING_ACTION
    |    ↓
    | ACTION_...
    |
    |--------------------------------------------------------------------------
    */

    console.log(
      "\n⏳ Waiting for RecoverAI agent..."
    );

    const startedAt =
      Date.now();

    const timeoutMs =
      90000;

    let currentCase = null;

    let lastStatus = null;

    while (
      Date.now() - startedAt <
      timeoutMs
    ) {
      currentCase =
        await RecoveryCase.findById(
          caseId
        ).select(
          "status riskScore recoveryProbability expectedRecovery priorityScore rootCause diagnosisConfidence recommendedAction currentAction attempts amountRecovered nextActionAt"
        );

      if (!currentCase) {
        throw new Error(
          "Recovery case could not be found while polling."
        );
      }

      /*
       * Only print when status changes to keep the terminal clean.
       */

      if (
        currentCase.status !==
        lastStatus
      ) {
        console.log(
          `Current status: ${currentCase.status}`
        );

        lastStatus =
          currentCase.status;
      }

      /*
       * If the case is still in an active workflow state,
       * keep waiting.
       */

      if (
        ACTIVE_STATES.includes(
          currentCase.status
        )
      ) {
        await sleep(2000);
        continue;
      }

      /*
       * Any non-active state means the workflow has moved
       * beyond the AI/policy/action processing stage.
       */

      break;
    }

    /*
    |--------------------------------------------------------------------------
    | Timeout
    |--------------------------------------------------------------------------
    */

    if (
      currentCase &&
      ACTIVE_STATES.includes(
        currentCase.status
      )
    ) {
      throw new Error(
        `RecoverAI agent did not finish within ${timeoutMs / 1000} seconds. Last status: ${currentCase.status}`
      );
    }

    /*
    |--------------------------------------------------------------------------
    | Final result
    |--------------------------------------------------------------------------
    */

    console.log(
      "\n===== FINAL RECOVERY CASE =====\n"
    );

    console.log(
      JSON.stringify(
        {
          recoveryCaseId:
            currentCase._id.toString(),

          status:
            currentCase.status,

          riskScore:
            currentCase.riskScore,

          recoveryProbability:
            currentCase.recoveryProbability,

          expectedRecovery:
            currentCase.expectedRecovery,

          priorityScore:
            currentCase.priorityScore,

          rootCause:
            currentCase.rootCause,

          diagnosisConfidence:
            currentCase.diagnosisConfidence,

          recommendedAction:
            currentCase.recommendedAction,

          currentAction:
            currentCase.currentAction,

          attempts:
            currentCase.attempts,

          amountRecovered:
            currentCase.amountRecovered,

          nextActionAt:
            currentCase.nextActionAt
        },
        null,
        2
      )
    );

    console.log(
      "\n================================\n"
    );

  } catch (error) {
    console.error(
      "\n❌ Webhook test failed:\n"
    );

    console.error(
      error.message
    );

    console.log(
      "\n================================\n"
    );
  } finally {
    /*
    |--------------------------------------------------------------------------
    | Close MongoDB only AFTER the polling loop has finished.
    |--------------------------------------------------------------------------
    */

    try {
      if (
        mongoose.connection.readyState !==
        0
      ) {
        await mongoose.connection.close();
      }
    } catch (closeError) {
      console.error(
        "MongoDB cleanup warning:",
        closeError.message
      );
    }
  }
};

testWebhook();