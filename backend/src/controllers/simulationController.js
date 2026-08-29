import getMerchant from "../utils/getMerchant.js";

import runSimulation from "../services/simulationService.js";
import Customer from "../models/Customer.js";
import processRazorpayWebhook from "../services/razorpayWebhookService.js";
import crypto from "crypto";

const runBatchSimulation = async (
  req,
  res
) => {
  try {
    const merchant =
      await getMerchant(
        req.body?.merchantId
      );

    const batchSize =
      Number(
        req.body?.batchSize || 10
      );

    const mode =
      req.body?.mode ||
      "SIMULATION";

    const result =
      await runSimulation({
        merchantId:
          merchant._id,

        batchSize,

        mode
      });

    res.status(200).json({
      success: true,

      data: {
        merchant: {
          id: merchant._id,

          businessName:
            merchant.businessName
        },

        ...result
      }
    });
  } catch (error) {
    console.error(
      "Batch simulation error:",
      error.message
    );

    res.status(500).json({
      success: false,

      message:
        error.message
    });
  }
};

const scenarios = {
  GOLDEN_CASE: {
    email: "amit.singh@example.demo",
    amount: 4999,
    method: "card",
    failureCode: "BANK_TEMPORARY_FAILURE",
    failureReason: "Temporary bank-side payment failure"
  },
  TEMPORARY_BANK_FAILURE: {
    email: "amit.singh@example.demo",
    amount: 4999,
    method: "card",
    failureCode: "BANK_TEMPORARY_FAILURE",
    failureReason: "Temporary bank-side payment failure"
  },
  EXPIRED_PAYMENT_METHOD: {
    email: "customer2@demo.recoverai.local",
    amount: 4999,
    method: "card",
    failureCode: "CARD_EXPIRED",
    failureReason: "Payment method has expired"
  },
  INSUFFICIENT_FUNDS: {
    email: "customer3@demo.recoverai.local",
    amount: 4999,
    method: "upi",
    failureCode: "INSUFFICIENT_FUNDS",
    failureReason: "Insufficient funds"
  },
  AUTHENTICATION_FAILURE: {
    email: "customer4@demo.recoverai.local",
    amount: 4999,
    method: "card",
    failureCode: "AUTHENTICATION_FAILED",
    failureReason: "Payment authentication failed"
  },
  GATEWAY_TIMEOUT: {
    email: "customer5@demo.recoverai.local",
    amount: 4999,
    method: "netbanking",
    failureCode: "GATEWAY_TIMEOUT",
    failureReason: "Payment gateway timeout"
  },
  HIGH_VALUE_ESCALATION: {
    email: "amit.singh@example.demo",
    amount: 50000,
    method: "card",
    failureCode: "BANK_TEMPORARY_FAILURE",
    failureReason: "High-value temporary bank-side payment failure"
  }
};

const runScenarioSimulation = async (
  req,
  res
) => {
  try {
    const scenarioKey =
      req.body?.scenario ||
      "GOLDEN_CASE";

    const scenario =
      scenarios[scenarioKey];

    if (!scenario) {
      return res.status(400).json({
        success: false,
        message:
          "Unknown simulation scenario"
      });
    }

    const merchant =
      await getMerchant(
        req.body?.merchantId
      );

    const customer =
      await Customer.findOne({
        merchantId:
          merchant._id,
        email:
          scenario.email
      });

    if (!customer) {
      return res.status(404).json({
        success: false,
        message:
          `Demo customer not found: ${scenario.email}`
      });
    }

    const uniqueId =
      Date.now();

    const eventId =
      `evt_scenario_${scenarioKey.toLowerCase()}_${uniqueId}`;

    const payload = {
      entity: "event",
      account_id: "acc_demo_recoverai",
      event: "payment.failed",
      contains: ["payment"],
      payload: {
        payment: {
          entity: {
            id:
              `pay_scenario_${scenarioKey.toLowerCase()}_${uniqueId}`,
            entity: "payment",
            amount:
              scenario.amount,
            currency: "INR",
            status: "failed",
            order_id:
              `order_scenario_${scenarioKey.toLowerCase()}_${uniqueId}`,
            method:
              scenario.method,
            email:
              customer.email,
            error_code:
              scenario.failureCode,
            error_description:
              scenario.failureReason,
            error_reason:
              scenario.failureCode
          }
        }
      },
      created_at:
        Math.floor(Date.now() / 1000)
    };

    const rawBody =
      JSON.stringify(payload);

    const secret =
      process.env.RAZORPAY_WEBHOOK_SECRET;

    if (!secret) {
      throw new Error(
        "RAZORPAY_WEBHOOK_SECRET is missing."
      );
    }

    const signature =
      crypto
        .createHmac("sha256", secret)
        .update(rawBody)
        .digest("hex");

    const result =
      await processRazorpayWebhook({
        rawBody,
        signature,
        eventId,
        secret
      });

    res.status(200).json({
      success: true,
      data: {
        scenario:
          scenarioKey,
        mode:
          "SIMULATION",
        eventId,
        eventType:
          result.eventType,
        duplicate:
          result.duplicate,
        customerId:
          customer._id,
        customerName:
          customer.name,
        amount:
          scenario.amount,
        recoveryCaseId:
          result.result?.recoveryCase?._id ||
          null,
        status:
          result.result?.recoveryCase?.status ||
          null
      }
    });
  } catch (error) {
    console.error(
      "Scenario simulation error:",
      error.message
    );

    res.status(500).json({
      success: false,
      message:
        error.message
    });
  }
};

export {
  runBatchSimulation,
  runScenarioSimulation
};
