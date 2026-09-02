import crypto from "crypto";

import Merchant from "../models/Merchant.js";
import Payment from "../models/Payment.js";
import Customer from "../models/Customer.js";
import RecoveryCase from "../models/RecoveryCase.js";
import WebhookEvent from "../models/WebhookEvent.js";
import processRecoveryCase from "./recoveryOrchestrator.js";

import {
  createAuditLog
} from "./auditService.js";

import { calculateRisk } from "./riskEngine.js";

/*
|--------------------------------------------------------------------------
| Signature validation
|--------------------------------------------------------------------------
|
| Razorpay signs the RAW webhook body using HMAC SHA256.
|
|--------------------------------------------------------------------------
*/

const verifyWebhookSignature = ({
  rawBody,
  signature,
  secret
}) => {
  if (!rawBody) {
    throw new Error(
      "Raw webhook body is required"
    );
  }

  if (!signature) {
    throw new Error(
      "X-Razorpay-Signature header is missing"
    );
  }

  if (!secret) {
    throw new Error(
      "Razorpay webhook secret is not configured"
    );
  }

  const expectedSignature =
    crypto
      .createHmac(
        "sha256",
        secret
      )
      .update(rawBody)
      .digest("hex");

  /*
   * Timing-safe comparison prevents timing attacks.
   */

  const expectedBuffer =
    Buffer.from(
      expectedSignature,
      "utf8"
    );

  const receivedBuffer =
    Buffer.from(
      signature,
      "utf8"
    );

  if (
    expectedBuffer.length !==
    receivedBuffer.length
  ) {
    return false;
  }

  return crypto.timingSafeEqual(
    expectedBuffer,
    receivedBuffer
  );
};

/*
|--------------------------------------------------------------------------
| Get demo merchant
|--------------------------------------------------------------------------
|
| We currently have one Acme SaaS merchant.
| Later authentication / endpoint mapping can replace this.
|
|--------------------------------------------------------------------------
*/

const getWebhookMerchant =
  async () => {
    const merchant =
      (await Merchant.findOne({
        businessName: "IIITT SaaS"
      })) ||
      (await Merchant.findOne({
        businessName: "Acme SaaS"
      })) ||
      (await Merchant.findOne());

    if (!merchant) {
      throw new Error(
        "Demo merchant not found"
      );
    }

    return merchant;
  };

/*
|--------------------------------------------------------------------------
| Process payment.failed
|--------------------------------------------------------------------------
*/

const processPaymentFailed =
  async ({
    merchant,
    payload
  }) => {
    const entity =
      payload?.payload?.payment?.entity;

    if (!entity) {
      throw new Error(
        "payment.failed payload does not contain payment entity"
      );
    }

    const razorpayPaymentId =
      entity.id;

    if (!razorpayPaymentId) {
      throw new Error(
        "Razorpay payment ID is missing"
      );
    }

    /*
     * Try to find an existing payment first.
     */

    let payment =
      await Payment.findOne({
        razorpayPaymentId
      });

    /*
     * If payment already exists, update it.
     */

    if (payment) {
      payment.status =
        "FAILED";

      payment.failureCode =
        entity.error_code ||
        entity.error_reason ||
        "UNKNOWN";

      payment.failureReason =
        entity.error_description ||
        entity.error_reason ||
        "Payment failed";

      await payment.save();
    } else {
      /*
       * Create new payment record.
       *
       * We currently identify the demo customer from the
       * Razorpay email when possible.
       */

      const customerEmail =
        entity.email;

      const customer =
        customerEmail
          ? await Customer.findOne({
              merchantId:
                merchant._id,

              email:
                customerEmail
            })
          : null;

      if (!customer) {
        throw new Error(
          `No RecoverAI customer found for Razorpay email ${customerEmail || "unknown"}`
        );
      }

      payment =
        await Payment.create({
          merchantId:
            merchant._id,

          customerId:
            customer._id,

          razorpayPaymentId,

          razorpayOrderId:
            entity.order_id ||
            null,

          amount:
            Number(entity.amount || 0),

          currency:
            entity.currency ||
            "INR",

          status:
            "FAILED",

          method:
            entity.method ||
            null,

          failureCode:
            entity.error_code ||
            entity.error_reason ||
            "UNKNOWN",

          failureReason:
            entity.error_description ||
            entity.error_reason ||
            "Payment failed",

          isSimulation:
            false
        });
    }

    /*
     * Fetch customer for risk calculation
     */

    const customer =
      await Customer.findById(
        payment.customerId
      );

    if (!customer) {
      throw new Error(
        "Customer not found for payment"
      );
    }

    /*
     * Prevent duplicate RecoveryCase for the same payment.
     */

    const risk = calculateRisk({
      payment,
      customer
    });

    let recoveryCase =
      await RecoveryCase.findOne({
        paymentId:
          payment._id
      });

    if (!recoveryCase) {
      recoveryCase =
        await RecoveryCase.create({
          merchantId:
            merchant._id,

          customerId:
            payment.customerId,

          paymentId:
            payment._id,

          amountAtRisk:
            payment.amount,

          riskScore:
            risk.riskScore,

          recoveryProbability:
            risk.recoveryProbability,

          expectedRecovery:
            risk.expectedRecovery,

          priorityScore:
            risk.priorityScore,

          rootCause:
            "UNKNOWN",

          diagnosisConfidence:
            0,

          status:
            "DETECTED",

          attempts:
            0,

          amountRecovered:
            0,

          nextActionAt:
            null,

          evidence:
            [],

          timeline: [
            {
              event:
                "REVENUE_RISK_DETECTED",

              description:
                `₹${payment.amount.toLocaleString(
                  "en-IN"
                )} Razorpay payment identified as at risk.`,

              timestamp:
                new Date()
            },

            // {
            //   event:
            //     "RISK_ANALYSIS_COMPLETED",

            //   description:
            //     `Initial risk score ${risk.riskScore}/100. Recovery probability ${risk.recoveryProbability}%.`,

            //   timestamp:
            //     new Date()
            // },

            {
              event:
                "WEBHOOK_RECEIVED",

              description:
                "Razorpay payment.failed event received.",

              timestamp:
                new Date()
            },

            {
              event:
                "CASE_CREATED",

              description:
                "Recovery case created from Razorpay payment failure.",

              timestamp:
                new Date()
            }
          ]
        });
    }

    /*
     * Audit the incoming payment failure.
     */

    await createAuditLog({
      merchantId:
        merchant._id,

      recoveryCaseId:
        recoveryCase._id,

      actor:
        "RAZORPAY",

      eventType:
        "PAYMENT_FAILED",

      description:
        `Razorpay reported payment ${razorpayPaymentId} as failed.`,

      metadata: {
        razorpayPaymentId,

        amount:
          payment.amount,

        method:
          payment.method,

        failureCode:
          payment.failureCode,

        failureReason:
          payment.failureReason
      }
    });

    return {
      payment,
      recoveryCase
    };
  };

/*
|--------------------------------------------------------------------------
| Process webhook
|--------------------------------------------------------------------------
*/

const processRazorpayWebhook =
  async ({
    rawBody,
    signature,
    eventId
  }) => {
    const secret =
      process.env.RAZORPAY_WEBHOOK_SECRET;

    /*
     * Validate signature BEFORE parsing.
     */

    const valid =
      verifyWebhookSignature({
        rawBody,
        signature,
        secret
      });

    if (!valid) {
      throw new Error(
        "Invalid Razorpay webhook signature"
      );
    }

    if (!eventId) {
      throw new Error(
        "x-razorpay-event-id header is missing"
      );
    }

    /*
     * Parse only after signature validation.
     */

    const payload =
      JSON.parse(rawBody);

    const merchant =
      await getWebhookMerchant();

    /*
     * Idempotency check.
     */

    const existing =
      await WebhookEvent.findOne({
        eventId
      });

    if (existing) {
      /*
       * Do not process duplicate webhook.
       */

      if (
        !existing.processed
      ) {
        existing.processed =
          true;

        await existing.save();
      }

      return {
        duplicate: true,

        eventId,

        eventType:
          payload.event
      };
    }

    /*
     * Store event before processing.
     */

    const webhookEvent =
      await WebhookEvent.create({
        eventId,

        eventType:
          payload.event ||
          "UNKNOWN",

        merchantId:
          merchant._id,

        payload,

        receivedAt:
          new Date()
      });

    try {
      let result = null;

      switch (
        payload.event
      ) {
        case "payment.failed": {
          result =
            await processPaymentFailed({
              merchant,
              payload
            });

          /*
          * Start the recovery workflow after the failed
          * payment has been safely recorded.
          *
          * We intentionally don't block webhook ingestion
          * on the complete AI workflow.
          */

          processRecoveryCase({
            recoveryCaseId:
              result.recoveryCase._id,

            mode: "SIMULATION"
          })
            .then(() => {
              console.log(
                `RecoverAI agent started for recovery case ${result.recoveryCase._id}`
              );
            })
            .catch((error) => {
              console.error(
                `RecoverAI agent failed for recovery case ${result.recoveryCase._id}:`,
                error.message
              );
            });

          break;
        }

        case "payment.captured":
          /*
           * We will wire successful payment reconciliation
           * into the verification layer next.
           */

          result = {
            message:
              "payment.captured received"
          };

          break;

        case "payment.authorized":
          result = {
            message:
              "payment.authorized received"
          };

          break;

        default:
          result = {
            message:
              `Webhook event ${payload.event || "UNKNOWN"} received but no processor is configured yet.`
          };
      }

      webhookEvent.processed =
        true;

      webhookEvent.error =
        null;

      webhookEvent.processedAt =
        new Date();

      await webhookEvent.save();

      return {
        duplicate: false,

        eventId,

        eventType:
          payload.event,

        result
      };
    } catch (error) {
      webhookEvent.processed =
        false;

      webhookEvent.error =
        error.message;

      webhookEvent.processedAt =
        new Date();

      await webhookEvent.save();

      throw error;
    }
  };

export {
  verifyWebhookSignature,
  processRazorpayWebhook
};

export default processRazorpayWebhook;
