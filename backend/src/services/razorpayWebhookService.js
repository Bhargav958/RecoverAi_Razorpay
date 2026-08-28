import crypto from "crypto";

import Merchant from "../models/Merchant.js";
import Payment from "../models/Payment.js";
import Customer from "../models/Customer.js";
import RecoveryCase from "../models/RecoveryCase.js";
import WebhookEvent from "../models/WebhookEvent.js";

import { calculateRisk } from "./riskEngine.js";

import {
  createAuditLog
} from "./auditService.js";

/*
|--------------------------------------------------------------------------
| Verify Razorpay Webhook Signature
|--------------------------------------------------------------------------
|
| IMPORTANT:
|
| Razorpay requires the RAW webhook request body for signature
| verification.
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
      "Razorpay webhook signature is missing"
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
    throw new Error(
      "Invalid Razorpay webhook signature"
    );
  }

  if (
    !crypto.timingSafeEqual(
      expectedBuffer,
      receivedBuffer
    )
  ) {
    throw new Error(
      "Invalid Razorpay webhook signature"
    );
  }

  return true;
};

/*
|--------------------------------------------------------------------------
| Resolve merchant
|--------------------------------------------------------------------------
|
| For the current solo/demo version, we use the configured Acme SaaS
| merchant.
|
| Later, use Razorpay account_id -> Merchant.razorpayAccountId
| for multi-merchant support.
|
|--------------------------------------------------------------------------
*/

const resolveMerchant = async (
  accountId
) => {
  /*
   * Future multi-merchant lookup:
   *
   * Merchant.findOne({
   *   razorpayAccountId: accountId
   * })
   */

  const merchant =
    await Merchant.findOne({
      businessName: "Acme SaaS"
    });

  if (!merchant) {
    throw new Error(
      "RecoverAI demo merchant not found"
    );
  }

  return merchant;
};

/*
|--------------------------------------------------------------------------
| Handle payment.failed
|--------------------------------------------------------------------------
*/

const handlePaymentFailed = async ({
  merchant,
  paymentEntity
}) => {
  const razorpayPaymentId =
    paymentEntity.id;

  /*
   * Check whether we already have this payment.
   */

  let payment =
    await Payment.findOne({
      merchantId:
        merchant._id,

      razorpayPaymentId
    });

  /*
   * Try to associate customer using email.
   */

  let customer = null;

  if (payment?.customerId) {
    customer =
      await Customer.findById(
        payment.customerId
      );
  }

  if (!customer && paymentEntity.email) {
    customer =
      await Customer.findOne({
        merchantId:
          merchant._id,

        email:
          paymentEntity.email
      });
  }

  /*
   * For the hackathon demo, a known customer is required.
   */

  if (!customer) {
    throw new Error(
      `No RecoverAI customer found for Razorpay payment ${razorpayPaymentId}`
    );
  }

  /*
   * Create or update Payment.
   */

  if (!payment) {
    payment =
      await Payment.create({
        merchantId:
          merchant._id,

        customerId:
          customer._id,

        razorpayPaymentId,

        razorpayOrderId:
          paymentEntity.order_id ||
          null,

        amount:
          paymentEntity.amount,

        currency:
          paymentEntity.currency ||
          "INR",

        status:
          "FAILED",

        method:
          paymentEntity.method ||
          null,

        failureCode:
          paymentEntity.error_code ||
          "UNKNOWN",

        failureReason:
          paymentEntity.error_description ||
          paymentEntity.error_reason ||
          "Razorpay payment failed",

        isSimulation:
          false
      });
  } else {
    payment.status =
      "FAILED";

    payment.amount =
      paymentEntity.amount;

    payment.currency =
      paymentEntity.currency ||
      payment.currency;

    payment.method =
      paymentEntity.method ||
      payment.method;

    payment.failureCode =
      paymentEntity.error_code ||
      payment.failureCode ||
      "UNKNOWN";

    payment.failureReason =
      paymentEntity.error_description ||
      paymentEntity.error_reason ||
      payment.failureReason;

    await payment.save();
  }

  /*
   * Prevent duplicate recovery cases for the same payment.
   */

  let recoveryCase =
    await RecoveryCase.findOne({
      paymentId:
        payment._id
    });

  if (!recoveryCase) {
    const risk =
      calculateRisk({
        payment,
        customer
      });

    recoveryCase =
      await RecoveryCase.create({
        merchantId:
          merchant._id,

        customerId:
          customer._id,

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

        aiReason:
          undefined,

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

          {
            event:
              "RAZORPAY_PAYMENT_FAILED",

            description:
              `Razorpay payment ${razorpayPaymentId} failed.`,

            timestamp:
              new Date()
          },

          {
            event:
              "CASE_CREATED",

            description:
              "Recovery case created from Razorpay webhook.",

            timestamp:
              new Date()
          }
        ]
      });

    /*
     * Audit
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
        `Razorpay payment ${razorpayPaymentId} failed and was added to RecoverAI.`,

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

    await createAuditLog({
      merchantId:
        merchant._id,

      recoveryCaseId:
        recoveryCase._id,

      actor:
        "SYSTEM",

      eventType:
        "RECOVERY_CASE_CREATED",

      description:
        "Recovery case automatically created from a real Razorpay payment failure.",

      metadata: {
        recoveryCaseId:
          recoveryCase._id,

        riskScore:
          risk.riskScore,

        recoveryProbability:
          risk.recoveryProbability,

        expectedRecovery:
          risk.expectedRecovery
      }
    });
  }

  return {
    payment,
    recoveryCase,
    customer
  };
};

/*
|--------------------------------------------------------------------------
| Handle payment.captured
|--------------------------------------------------------------------------
*/

const handlePaymentCaptured = async ({
  merchant,
  paymentEntity
}) => {
  const razorpayPaymentId =
    paymentEntity.id;

  const payment =
    await Payment.findOne({
      merchantId:
        merchant._id,

      razorpayPaymentId
    });

  /*
   * If RecoverAI did not create this payment,
   * simply acknowledge the event.
   */

  if (!payment) {
    return {
      payment: null,
      recoveryCase: null,
      ignored: true
    };
  }

  payment.status =
    "CAPTURED";

  payment.paidAt =
    new Date();

  await payment.save();

  const recoveryCase =
    await RecoveryCase.findOne({
      paymentId:
        payment._id
    });

  if (
    recoveryCase &&
    recoveryCase.status !==
      "RECOVERED"
  ) {
    recoveryCase.amountRecovered =
      recoveryCase.amountAtRisk;

    recoveryCase.status =
      "RECOVERED";

    recoveryCase.currentAction =
      null;

    recoveryCase.nextActionAt =
      null;

    recoveryCase.stoppedReason =
      "Payment captured by Razorpay.";

    recoveryCase.timeline.push({
      event:
        "PAYMENT_RECOVERED",

      description:
        `₹${recoveryCase.amountAtRisk.toLocaleString(
          "en-IN"
        )} payment captured by Razorpay.`,

      timestamp:
        new Date()
    });

    recoveryCase.timeline.push({
      event:
        "RECOVERY_WORKFLOW_STOPPED",

      description:
        "Recovery workflow stopped because Razorpay confirmed payment capture.",

      timestamp:
        new Date()
    });

    await recoveryCase.save();

    await createAuditLog({
      merchantId:
        merchant._id,

      recoveryCaseId:
        recoveryCase._id,

      actor:
        "RAZORPAY",

      eventType:
        "PAYMENT_RECOVERED",

      description:
        `Razorpay confirmed capture of ₹${recoveryCase.amountAtRisk.toLocaleString(
          "en-IN"
        )}.`,

      metadata: {
        razorpayPaymentId,

        amountRecovered:
          recoveryCase.amountRecovered
      }
    });
  }

  return {
    payment,
    recoveryCase,
    ignored: false
  };
};

/*
|--------------------------------------------------------------------------
| Process webhook
|--------------------------------------------------------------------------
*/

const processRazorpayWebhook = async ({
  rawBody,
  signature,
  eventId,
  accountId,
  secret
}) => {
  verifyWebhookSignature({
    rawBody,
    signature,
    secret
  });

  /*
   * Parse only AFTER signature verification.
   */

  const payload =
    JSON.parse(
      rawBody
    );

  const merchant =
    await resolveMerchant(
      accountId
    );

  /*
   * Idempotency.
   */

  const existingEvent =
    await WebhookEvent.findOne({
      eventId
    });

  if (existingEvent) {
    return {
      duplicate: true,

      eventType:
        existingEvent.eventType,

      message:
        "Webhook event already processed."
    };
  }

  const event =
    await WebhookEvent.create({
      eventId,

      merchantId:
        merchant._id,

      eventType:
        payload.event,

      razorpayPaymentId:
        payload.payload?.payment?.entity?.id ||
        null,

      payload
    });

  try {
    let result = null;

    if (
      payload.event ===
      "payment.failed"
    ) {
      result =
        await handlePaymentFailed({
          merchant,

          paymentEntity:
            payload.payload
              ?.payment
              ?.entity
        });
    } else if (
      payload.event ===
      "payment.captured"
    ) {
      result =
        await handlePaymentCaptured({
          merchant,

          paymentEntity:
            payload.payload
              ?.payment
              ?.entity
        });
    } else {
      result = {
        ignored: true,

        message:
          `Event ${payload.event} is acknowledged but not processed by RecoverAI.`
      };
    }

    event.processed =
      true;

    event.processedAt =
      new Date();

    if (
      result?.payment
        ?._id
    ) {
      event.paymentId =
        result.payment._id;
    }

    await event.save();

    return {
      duplicate: false,

      eventType:
        payload.event,

      result
    };
  } catch (error) {
    event.error =
      error.message;

    await event.save();

    throw error;
  }
};

export {
  verifyWebhookSignature,
  processRazorpayWebhook
};

export default processRazorpayWebhook;