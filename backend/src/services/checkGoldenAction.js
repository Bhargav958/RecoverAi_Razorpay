import dotenv from "dotenv";
import mongoose from "mongoose";

import connectDB from "../config/db.js";
import RecoveryAction from "../models/RecoveryAction.js";

dotenv.config();

const CASE_ID =
  "6a92902dcb8072d854a6590f";

const run = async () => {
  try {
    await connectDB();

    const actions =
      await RecoveryAction.find({
        recoveryCaseId: CASE_ID
      }).sort({
        createdAt: -1
      });

    console.log(
      "\n===== GOLDEN CASE ACTIONS =====\n"
    );

    if (actions.length === 0) {
      console.log(
        "No RecoveryAction found."
      );
    } else {
      for (const action of actions) {
        console.log(
          JSON.stringify(
            {
              id: action._id,
              recoveryCaseId:
                action.recoveryCaseId,
              actionType:
                action.actionType,
              status:
                action.status,
              scheduledAt:
                action.scheduledAt,
              executedAt:
                action.executedAt,
              amountRecovered:
                action.amountRecovered
            },
            null,
            2
          )
        );
      }
    }

    console.log(
      "\n===============================\n"
    );
  } catch (error) {
    console.error(
      "Check failed:",
      error.message
    );
  } finally {
    if (
      mongoose.connection.readyState !==
      0
    ) {
      await mongoose.connection.close();
    }
  }
};

run();