import dotenv from "dotenv";

import connectDB from "../config/db.js";

import RecoveryCase from "../models/RecoveryCase.js";
import Customer from "../models/Customer.js";

import recoveryActionService from "./recoveryActionService.js";

dotenv.config();

const testRecoveryAction = async () => {
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
        customerId:
          customer._id
      });

    if (!recoveryCase) {
      throw new Error(
        "Recovery case not found"
      );
    }

    /*
     * Pretend the AI + policy engine
     * already approved this action.
     */

    const policyResult = {
      allowed: true,

      action:
        "RETRY_PAYMENT",

      scheduledAt:
        new Date(
          Date.now() +
            6 * 60 * 60 * 1000
        ),

      requiresHumanApproval:
        false,

      reason:
        "Retry is allowed by the merchant policy."
    };

    const result =
      await recoveryActionService({
        recoveryCase,
        policyResult,
        mode: "SIMULATION"
      });

    console.log(
      "\n===== RECOVERY ACTION TEST =====\n"
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
      "Action:",
      policyResult.action
    );

    console.log(
      "Mode:",
      "SIMULATION"
    );

    console.log(
      "Success:",
      result.success
    );

    console.log(
      "Scheduled:",
      result.scheduled
    );

    console.log(
      "Executed:",
      result.executed
    );

    console.log(
      "Recovery Action ID:",
      result.action?._id
    );

    console.log(
      "Scheduled At:",
      result.action?.scheduledAt
    );

    console.log(
      "\n=================================\n"
    );

    process.exit(0);

  } catch (error) {
    console.error(
      "\nRecovery action test failed:"
    );

    console.error(
      error.message
    );

    process.exit(1);
  }
};

testRecoveryAction();