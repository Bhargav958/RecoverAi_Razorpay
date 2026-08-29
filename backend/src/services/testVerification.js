import dotenv from "dotenv";
import mongoose from "mongoose";

import connectDB from "../config/db.js";

import RecoveryAction from "../models/RecoveryAction.js";
import verifyRecovery from "./verificationService.js";

dotenv.config();

const ACTION_ID =
  process.argv[2];

const testVerification = async () => {
  try {
    if (!ACTION_ID) {
      throw new Error(
        "Please provide a RecoveryAction ID."
      );
    }

    await connectDB();

    console.log(
      "\n===== RECOVERY VERIFICATION TEST =====\n"
    );

    console.log(
      "Recovery Action ID:",
      ACTION_ID
    );

    const action =
      await RecoveryAction.findById(
        ACTION_ID
      );

    if (!action) {
      throw new Error(
        "Recovery action not found."
      );
    }

    console.log(
      "\nBefore verification:"
    );

    console.log(
      JSON.stringify(
        {
          actionId:
            action._id.toString(),

          recoveryCaseId:
            action.recoveryCaseId.toString(),

          actionType:
            action.actionType,

          status:
            action.status,

          amountRecovered:
            action.amountRecovered
        },
        null,
        2
      )
    );

    /*
    |--------------------------------------------------------------------------
    | Run verification
    |--------------------------------------------------------------------------
    */

    const result =
      await verifyRecovery({
        recoveryActionId:
          action._id,

        simulateSuccess:
          true
      });

    console.log(
      "\nVerification result:"
    );

    console.log(
      JSON.stringify(
        {
          success:
            result.success,

          recovered:
            result.recovered,

          alreadyVerified:
            result.alreadyVerified,

          amountRecovered:
            result.amountRecovered,

          caseStatus:
            result.recoveryCase?.status,

          paymentStatus:
            result.payment?.status
        },
        null,
        2
      )
    );

    console.log(
      "\n======================================\n"
    );

  } catch (error) {
    console.error(
      "\n❌ Verification test failed:\n"
    );

    console.error(
      error.message
    );

    console.log(
      "\n======================================\n"
    );
  } finally {
    try {
      if (
        mongoose.connection.readyState !==
        0
      ) {
        await mongoose.connection.close();
      }
    } catch (error) {
      console.error(
        "MongoDB cleanup warning:",
        error.message
      );
    }
  }
};

testVerification();