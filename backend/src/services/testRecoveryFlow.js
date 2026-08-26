import dotenv from "dotenv";

import connectDB from "../config/db.js";

import Customer from "../models/Customer.js";
import RecoveryCase from "../models/RecoveryCase.js";
import RecoveryAction from "../models/RecoveryAction.js";

import executeRecoveryAction from "./actionExecutionService.js";
import verifyRecovery from "./verificationService.js";

dotenv.config();

const runRecoveryFlow = async () => {
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
        "Recovery case not found"
      );
    }

    /*
     * Find the most recent action.
     */

    const recoveryAction =
      await RecoveryAction.findOne({
        recoveryCaseId:
          recoveryCase._id
      }).sort({
        createdAt: -1
      });

    if (!recoveryAction) {
      throw new Error(
        "Recovery action not found"
      );
    }

    console.log(
      "\n===== RECOVERAI RECOVERY FLOW =====\n"
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
      "Initial Case Status:",
      recoveryCase.status
    );

    console.log(
      "Initial Action Status:",
      recoveryAction.status
    );

    /*
     |--------------------------------------------------------------------------
     | Execute
     |--------------------------------------------------------------------------
     */

    const execution =
      await executeRecoveryAction({
        recoveryActionId:
          recoveryAction._id,

        mode: "SIMULATION"
      });

    console.log(
      "\nAfter execution:"
    );

    console.log(
      "Action Status:",
      execution.action.status
    );

    console.log(
      "Case Status:",
      execution.recoveryCase.status
    );

    console.log(
      "Attempts:",
      execution.recoveryCase.attempts
    );

    /*
     |--------------------------------------------------------------------------
     | Verify
     |--------------------------------------------------------------------------
     */

    const verification =
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
      verification.recovered
    );

    console.log(
      "Amount Recovered:",
      `₹${verification.amountRecovered}`
    );

    console.log(
      "Action Status:",
      verification.action.status
    );

    console.log(
      "Case Status:",
      verification.recoveryCase.status
    );

    console.log(
      "Stopped Reason:",
      verification.recoveryCase.stoppedReason
    );

    console.log(
      "\n===================================\n"
    );

    process.exit(0);

  } catch (error) {
    console.error(
      "\nRecovery flow failed:"
    );

    console.error(
      error.message
    );

    process.exit(1);
  }
};

runRecoveryFlow();