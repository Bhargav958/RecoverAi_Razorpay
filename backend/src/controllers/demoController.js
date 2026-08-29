import crypto from "crypto";

import Customer from "../models/Customer.js";

import processRazorpayWebhook from "../services/razorpayWebhookService.js";

/*
|--------------------------------------------------------------------------
| Demo Controller
|--------------------------------------------------------------------------
|
| Creates a signed Razorpay-style payment.failed event and sends it
| through the SAME webhook processing pipeline used by the real webhook.
|
|--------------------------------------------------------------------------
*/

const simulatePaymentFailure = async (
  req,
  res
) => {
  try {
    /*
    |--------------------------------------------------------------------------
    | Find customer
    |--------------------------------------------------------------------------
    */

    const email =
      req.body?.email ||
      "amit.singh@example.demo";

    const customer =
      await Customer.findOne({
        email
      });

    if (!customer) {
      return res.status(404).json({
        success: false,
        message:
          `Demo customer not found: ${email}`
      });
    }

    /*
    |--------------------------------------------------------------------------
    | Input
    |--------------------------------------------------------------------------
    */

    const amount =
      Number(
        req.body?.amount || 4999
      );

    const method =
      req.body?.method ||
      "card";

    const failureCode =
      req.body?.failureCode ||
      "BANK_TEMPORARY_FAILURE";

    const failureReason =
      req.body?.failureReason ||
      "Temporary bank-side payment failure";

    /*
    |--------------------------------------------------------------------------
    | Validate amount
    |--------------------------------------------------------------------------
    */

    if (
      !Number.isFinite(amount) ||
      amount <= 0
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Amount must be a positive number."
      });
    }

    /*
    |--------------------------------------------------------------------------
    | Generate unique IDs
    |--------------------------------------------------------------------------
    */

    const uniqueId =
      Date.now();

    const eventId =
      `evt_demo_ui_${uniqueId}`;

    const paymentId =
      `pay_demo_ui_${uniqueId}`;

    const orderId =
      `order_demo_ui_${uniqueId}`;

    /*
    |--------------------------------------------------------------------------
    | Build Razorpay-style event
    |--------------------------------------------------------------------------
    */

    const payload = {
      entity:
        "event",

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

            amount,

            currency:
              "INR",

            status:
              "failed",

            order_id:
              orderId,

            method,

            email:
              customer.email,

            error_code:
              failureCode,

            error_description:
              failureReason,

            error_reason:
              failureCode
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
    | Webhook secret
    |--------------------------------------------------------------------------
    */

    const secret =
      process.env.RAZORPAY_WEBHOOK_SECRET;

    if (!secret) {
      throw new Error(
        "RAZORPAY_WEBHOOK_SECRET is missing."
      );
    }

    /*
    |--------------------------------------------------------------------------
    | Generate Razorpay-compatible signature
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
    | Send through actual webhook service
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
    | Response
    |--------------------------------------------------------------------------
    */

    return res.status(200).json({
      success: true,

      data: {
        mode:
          "SIMULATION",

        eventId,

        eventType:
          result.eventType,

        duplicate:
          result.duplicate,

        paymentId:
          result.result?.payment?._id ||
          null,

        recoveryCaseId:
          result.result?.recoveryCase?._id ||
          null,

        customerId:
          customer._id,

        customerName:
          customer.name,

        amount,

        status:
          result.result?.recoveryCase?.status ||
          null
      }
    });
  } catch (error) {
    console.error(
      "Demo payment failure error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        error.message
    });
  }
};

export {
  simulatePaymentFailure
};