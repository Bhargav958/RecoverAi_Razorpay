import dotenv from "dotenv";
import mongoose from "mongoose";
import connectDB from "../config/db.js";

import RecoveryCase from "../models/RecoveryCase.js";
import Customer from "../models/Customer.js";
import Payment from "../models/Payment.js";

import { calculateRisk } from "./riskEngine.js";
import diagnosePaymentFailure from "./diagnosePaymentFailure.js";

dotenv.config();

const CASE_ID =
  process.argv[2];

const sleep = (ms) =>
  new Promise((resolve) =>
    setTimeout(resolve, ms)
  );

const testDiagnosis = async () => {
  let mongoConnected = false;

  try {
    if (!CASE_ID) {
      throw new Error(
        "Please provide a Recovery Case ID."
      );
    }

    await connectDB();

    mongoConnected = true;

    console.log(
      "\n===== DIRECT DIAGNOSIS TEST =====\n"
    );

    console.log(
      "Case:",
      CASE_ID
    );

    const recoveryCase =
      await RecoveryCase.findById(
        CASE_ID
      );

    if (!recoveryCase) {
      throw new Error(
        "Recovery case not found."
      );
    }

    const customer =
      await Customer.findById(
        recoveryCase.customerId
      );

    if (!customer) {
      throw new Error(
        "Customer not found."
      );
    }

    const payment =
      await Payment.findById(
        recoveryCase.paymentId
      );

    if (!payment) {
      throw new Error(
        "Payment not found."
      );
    }

    const risk =
      calculateRisk({
        payment,
        customer
      });

    console.log(
      "Risk:",
      JSON.stringify(
        risk,
        null,
        2
      )
    );

    console.log(
      "\n⏳ Calling diagnosis service...\n"
    );

    const started =
      Date.now();

    const result =
      await diagnosePaymentFailure({
        payment,
        customer,
        risk
      });

    const elapsed =
      Date.now() -
      started;

    console.log(
      `\n✅ Diagnosis returned in ${elapsed} ms\n`
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
  } catch (error) {
    console.error(
      "\n❌ Diagnosis test failed:\n"
    );

    console.error(
      error
    );

    console.log(
      "\n=================================\n"
    );
  } finally {
    /*
     * Give pending Node handles a moment to settle.
     * Do NOT use process.exit().
     */

    if (mongoConnected) {
  try {
    await sleep(500);
    await mongoose.connection.close();
  } catch (closeError) {
    console.error(
      "MongoDB cleanup warning:",
      closeError.message
    );
  }
}
  }
};

testDiagnosis();