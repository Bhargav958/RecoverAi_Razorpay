import dotenv from "dotenv";

import connectDB from "../config/db.js";

import Merchant from "../models/Merchant.js";
import Customer from "../models/Customer.js";
import RecoveryCase from "../models/RecoveryCase.js";
import Payment from "../models/Payment.js";

import { createAuditLog } from "./auditService.js";

dotenv.config();

const testRealEscalation = async () => {
  try {
    await connectDB();

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
        "Merchant not found"
      );
    }

    const customer =
      await Customer.findOne({
        merchantId:
          merchant._id
      });

    if (!customer) {
      throw new Error(
        "Customer not found"
      );
    }

    /*
    |--------------------------------------------------------------------------
    | Create a simulated high-value payment
    |--------------------------------------------------------------------------
    */

    const payment =
      await Payment.create({
        merchantId:
          merchant._id,

        customerId:
          customer._id,

        razorpayPaymentId:
          `pay_escalation_${Date.now()}`,

        razorpayOrderId:
          `order_escalation_${Date.now()}`,

        amount:
          50000,

        currency:
          "INR",

        status:
          "FAILED",

        method:
          "card",

        failureCode:
          "BANK_TEMPORARY_FAILURE",

        failureReason:
          "Temporary bank-side payment failure",

        isSimulation:
          true
      });

    const recoveryCase =
      await RecoveryCase.create({
        merchantId:
          merchant._id,

        customerId:
          customer._id,

        paymentId:
          payment._id,

        amountAtRisk:
          50000,

        riskScore:
          82,

        recoveryProbability:
          79,

        expectedRecovery:
          39500,

        priorityScore:
          50000,

        rootCause:
          "TEMPORARY_BANK_FAILURE",

        diagnosisConfidence:
          95,

        recommendedAction:
          "RETRY_PAYMENT",

        currentAction:
          "HUMAN_ESCALATION",

        status:
          "ESCALATED",

        attempts:
          0,

        amountRecovered:
          0,

        nextActionAt:
          null,

        aiReason:
          "High-value recovery requires merchant approval.",

        evidence: [
          "Amount at risk exceeds autonomous recovery threshold",
          "AI confidence is 95%"
        ],

        timeline: [
          {
            event:
              "HUMAN_ESCALATION",

            description:
              "Recovery action requires human approval because the amount exceeds the autonomous execution threshold.",

            timestamp:
              new Date()
          }
        ]
      });

    await createAuditLog({
      merchantId:
        merchant._id,

      recoveryCaseId:
        recoveryCase._id,

      actor:
        "POLICY_ENGINE",

      eventType:
        "HUMAN_ESCALATION",

      description:
        "High-value case requires merchant approval before recovery can continue.",

      metadata: {
        amountAtRisk: 50000,

        threshold:
          25000,

        recommendedAction:
          "RETRY_PAYMENT"
      }
    });

    console.log(
      "\n===== REAL ESCALATION TEST =====\n"
    );

    console.log(
      "Case:",
      recoveryCase._id
    );

    console.log(
      "Customer:",
      customer.name
    );

    console.log(
      "Amount:",
      "₹50,000"
    );

    console.log(
      "Status:",
      recoveryCase.status
    );

    console.log(
      "Recommended Action:",
      recoveryCase.recommendedAction
    );

    console.log(
      "\nOpen this case in the Command Center."
    );

    console.log(
      "=================================\n"
    );

    process.exit(0);

  } catch (error) {
    console.error(
      "\nReal escalation test failed:"
    );

    console.error(
      error.message
    );

    process.exit(1);
  }
};

testRealEscalation();