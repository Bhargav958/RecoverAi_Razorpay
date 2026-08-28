import dotenv from "dotenv";

import connectDB from "../config/db.js";

import Merchant from "../models/Merchant.js";
import RecoveryCase from "../models/RecoveryCase.js";
import Customer from "../models/Customer.js";

import evaluatePolicy from "./policyEngine.js";

dotenv.config();

const testPolicyEscalation = async () => {
  try {
    await connectDB();

    /*
    |--------------------------------------------------------------------------
    | Find merchant
    |--------------------------------------------------------------------------
    */

    const merchant =
      await Merchant.findOne({
        businessName: "Acme SaaS"
      });

    if (!merchant) {
      throw new Error(
        "Acme SaaS merchant not found"
      );
    }

    /*
    |--------------------------------------------------------------------------
    | Find an existing recovery case
    |--------------------------------------------------------------------------
    */

    const recoveryCase =
      await RecoveryCase.findOne({
        merchantId:
          merchant._id
      });

    if (!recoveryCase) {
      throw new Error(
        "No recovery case found"
      );
    }

    /*
    |--------------------------------------------------------------------------
    | Find customer
    |--------------------------------------------------------------------------
    */

    const customer =
      await Customer.findById(
        recoveryCase.customerId
      );

    if (!customer) {
      throw new Error(
        "Customer not found"
      );
    }

    /*
    |--------------------------------------------------------------------------
    | Create a simulated high-value case
    |--------------------------------------------------------------------------
    |
    | We DO NOT save this modified amount to MongoDB.
    |
    */

    const simulatedCase = {
      ...recoveryCase.toObject(),

      amountAtRisk:
        50000,

      attempts: 0
    };

    /*
    |--------------------------------------------------------------------------
    | Simulated AI recommendation
    |--------------------------------------------------------------------------
    */

    const diagnosis = {
      rootCause:
        "TEMPORARY_BANK_FAILURE",

      confidence:
        95,

      recommendedAction:
        "RETRY_PAYMENT",

      delayHours:
        6,

      reason:
        "High confidence retry recommendation.",

      evidence: [
        "Temporary bank failure"
      ],

      requiresHumanApproval:
        false
    };

    /*
    |--------------------------------------------------------------------------
    | Evaluate policy
    |--------------------------------------------------------------------------
    */

    const result =
      await evaluatePolicy({
        recoveryCase:
          simulatedCase,

        customer,

        diagnosis
      });

    console.log(
      "\n===== POLICY ESCALATION TEST =====\n"
    );

    console.log(
      "Simulated Amount:",
      "₹50,000"
    );

    console.log(
      "AI Confidence:",
      "95%"
    );

    console.log(
      "AI Recommendation:",
      "RETRY_PAYMENT"
    );

    console.log(
      "\nPolicy Result:"
    );

    console.log(
      JSON.stringify(
        result,
        null,
        2
      )
    );

    const lowConfidenceDiagnosis = {
      rootCause:
        "TEMPORARY_BANK_FAILURE",

      confidence:
        35,

      recommendedAction:
        "RETRY_PAYMENT",

      delayHours:
        6,

      reason:
        "Low confidence diagnosis.",

      evidence: [
        "Insufficient evidence"
      ],

      requiresHumanApproval:
        false
    };

    const lowConfidenceResult =
      await evaluatePolicy({
        recoveryCase:
          simulatedCase,

        customer,

        diagnosis:
          lowConfidenceDiagnosis
      });

    console.log(
      "\nLow Confidence Result:"
    );

    console.log(
      JSON.stringify(
        lowConfidenceResult,
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
      "\nPolicy escalation test failed:"
    );

    console.error(
      error.message
    );

    process.exit(1);
  }
};

testPolicyEscalation();
