import dotenv from "dotenv";
import mongoose from "mongoose";

import connectDB from "../config/db.js";
import RecoveryCase from "../models/RecoveryCase.js";
import {
  processDueActions
} from "./recoveryWorker.js";

dotenv.config();

const recoveryCaseId =
  process.argv[2];

const testTargetedWorker = async () => {
  try {
    if (!recoveryCaseId) {
      throw new Error(
        "Please provide a RecoveryCase ID."
      );
    }

    await connectDB();

    const before =
      await RecoveryCase.findById(
        recoveryCaseId
      ).select(
        "status amountAtRisk amountRecovered recommendedAction nextActionAt"
      );

    if (!before) {
      throw new Error(
        "Recovery case not found."
      );
    }

    const result =
      await processDueActions({
        recoveryCaseId,
        ignoreSchedule: true,
        mode: "SIMULATION",
        limit: 1
      });

    const after =
      await RecoveryCase.findById(
        recoveryCaseId
      ).select(
        "status amountAtRisk amountRecovered recommendedAction nextActionAt"
      );

    console.log(
      JSON.stringify(
        {
          before,
          workerResult: result,
          after
        },
        null,
        2
      )
    );
  } catch (error) {
    console.error(
      error.message
    );
    process.exitCode = 1;
  } finally {
    if (
      mongoose.connection.readyState !==
      0
    ) {
      await mongoose.connection.close();
    }
  }
};

testTargetedWorker();
