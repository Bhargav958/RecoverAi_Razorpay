import dotenv from "dotenv";

import connectDB from "../config/db.js";

import RecoveryCase from "../models/RecoveryCase.js";
import Customer from "../models/Customer.js";

import evaluatePolicy from "./policyEngine.js";

dotenv.config();

const testPolicy = async () => {
  try {
    await connectDB();

    const customer =
      await Customer.findOne({
        name: "Amit Singh"
      });

    if (!customer) {
      throw new Error(
        "Amit Singh not found"
      );
    }

    const recoveryCase =
      await RecoveryCase.findOne({
        customerId: customer._id
      });

    if (!recoveryCase) {
      throw new Error(
        "Amit's recovery case not found"
      );
    }

    const diagnosis = {
      rootCause:
        "TEMPORARY_BANK_FAILURE",

      confidence: 91,

      recommendedAction:
        "RETRY_PAYMENT",

      delayHours: 1,

      reason:
        "Temporary failure with strong payment history.",

      evidence: [
        "Strong payment history"
      ],

      requiresHumanApproval: false
    };

    const result =
      await evaluatePolicy({
        recoveryCase,
        customer,
        diagnosis
      });

    console.log(
      "\n===== POLICY ENGINE TEST =====\n"
    );

    console.log(
      "Customer:",
      customer.name
    );

    console.log(
      "Amount:",
      `₹${recoveryCase.amountAtRisk}`
    );

    console.log(
      "AI Action:",
      diagnosis.recommendedAction
    );

    console.log(
      "AI Delay:",
      `${diagnosis.delayHours} hour(s)`
    );

    console.log(
      "AI Confidence:",
      `${diagnosis.confidence}%`
    );

    console.log(
      "\nPolicy Result:"
    );

    console.log(
      "Allowed:",
      result.allowed
    );

    console.log(
      "Final Action:",
      result.action
    );

    console.log(
      "Requires Human Approval:",
      result.requiresHumanApproval
    );

    console.log(
      "Reason:",
      result.reason
    );

    if (result.scheduledAt) {
      console.log(
        "Scheduled At:",
        result.scheduledAt
      );
    }

    console.log(
      "\n===============================\n"
    );

    process.exit(0);

  } catch (error) {
    console.error(
      "\nPolicy test failed:"
    );

    console.error(
      error.message
    );

    process.exit(1);
  }
};

testPolicy();