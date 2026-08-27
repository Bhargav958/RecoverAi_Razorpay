import dotenv from "dotenv";

import connectDB from "../config/db.js";
import Customer from "../models/Customer.js";

import {
  processDueActions
} from "./recoveryWorker.js";

dotenv.config();

const testRecoveryWorker = async () => {
  try {
    await connectDB();

    /*
    |--------------------------------------------------------------------------
    | Find the merchant through Amit
    |--------------------------------------------------------------------------
    */

    const customer =
      await Customer.findOne({
        name: "Amit Singh"
      });

    if (!customer) {
      throw new Error(
        "Amit Singh not found"
      );
    }

    console.log(
      "\n===== RECOVERAI WORKER TEST =====\n"
    );

    console.log(
      "Customer:",
      customer.name
    );

    console.log(
      "Running scheduled recovery worker in DEMO mode..."
    );

    /*
     * ignoreSchedule=true
     *
     * This means we don't have to actually wait until
     * Amit's scheduled retry time.
     */

    const result =
      await processDueActions({
        ignoreSchedule: true,

        mode: "SIMULATION",

        limit: 10
      });

    console.log(
      "\nWorker Result:"
    );

    console.log(
      JSON.stringify(
        result,
        null,
        2
      )
    );

    console.log(
      "\n=================================\n"
    );

    process.exit(0);

  } catch (error) {
    console.error(
      "\nWorker test failed:"
    );

    console.error(
      error.message
    );

    process.exit(1);
  }
};

testRecoveryWorker();