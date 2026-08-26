import dotenv from "dotenv";

import connectDB from "../config/db.js";

import Customer from "../models/Customer.js";
import RecoveryCase from "../models/RecoveryCase.js";
import RecoveryAction from "../models/RecoveryAction.js";

import verifyRecovery from "./verificationService.js";

dotenv.config();

const testVerification = async () => {
  try {
    await connectDB();

    /*
    |--------------------------------------------------------------------------
    | Find Mohan
    |--------------------------------------------------------------------------
    */

    const customer =
      await Customer.findOne({
        name: "Mohan Reddy"
      });

    if (!customer) {
      throw new Error(
        "Mohan Reddy not found"
      );
    }

    /*
    |--------------------------------------------------------------------------
    | Find a case that has an EXECUTED action
    |--------------------------------------------------------------------------
    */

    const recoveryCase =
      await RecoveryCase.findOne({
        customerId: customer._id,
        status: "ACTION_EXECUTED"
      });

    if (!recoveryCase) {
      throw new Error(
        "No ACTION_EXECUTED recovery case found for Mohan Reddy"
      );
    }

    /*
    |--------------------------------------------------------------------------
    | Find the latest executed action
    |--------------------------------------------------------------------------
    */

    const recoveryAction =
      await RecoveryAction.findOne({
        recoveryCaseId:
          recoveryCase._id,

        status: "EXECUTED"
      }).sort({
        createdAt: -1
      });

    if (!recoveryAction) {
      throw new Error(
        "No EXECUTED recovery action found"
      );
    }

    console.log(
      "\n===== RECOVERAI VERIFICATION TEST =====\n"
    );

    console.log(
      "Customer:",
      customer.name
    );

    console.log(
      "Amount at risk:",
      `₹${recoveryCase.amountAtRisk}`
    );

    console.log(
      "Recovery Action:",
      recoveryAction.actionType
    );

    console.log(
      "Before verification:"
    );

    console.log(
      "Case status:",
      recoveryCase.status
    );

    console.log(
      "Action status:",
      recoveryAction.status
    );

    console.log(
      "Amount recovered:",
      `₹${recoveryCase.amountRecovered}`
    );

    /*
    |--------------------------------------------------------------------------
    | Verify successful recovery
    |--------------------------------------------------------------------------
    */

    const result =
      await verifyRecovery({
        recoveryActionId:
          recoveryAction._id,

        simulateSuccess: true
      });

    console.log(
      "\nAfter verification:"
    );

    console.log(
      "Recovered:",
      result.recovered
    );

    console.log(
      "Amount recovered:",
      `₹${result.amountRecovered}`
    );

    console.log(
      "Case status:",
      result.recoveryCase.status
    );

    console.log(
      "Action status:",
      result.action.status
    );

    console.log(
      "Payment status:",
      result.payment.status
    );

    console.log(
      "Stopped reason:",
      result.recoveryCase.stoppedReason
    );

    console.log(
      "\n========================================\n"
    );

    process.exit(0);

  } catch (error) {
    console.error(
      "\nVerification test failed:"
    );

    console.error(
      error.message
    );

    process.exit(1);
  }
};

testVerification();