import dotenv from "dotenv";
import connectDB from "../config/db.js";

import Customer from "../models/Customer.js";
import "../models/Payment.js";
import RecoveryCase from "../models/RecoveryCase.js";

dotenv.config();

const findGoldenCase = async () => {
  try {
    await connectDB();

    const amit = await Customer.findOne({
      name: "Amit Singh"
    });

    if (!amit) {
      throw new Error(
        "Amit Singh was not found"
      );
    }

    const recoveryCase =
      await RecoveryCase.findOne({
        customerId: amit._id
      }).populate("paymentId");

    if (!recoveryCase) {
      throw new Error(
        "Recovery case for Amit Singh was not found"
      );
    }

    console.log("\n===== GOLDEN CASE =====\n");

    console.log(
      `Customer: ${amit.name}`
    );

    console.log(
      `Customer ID: ${amit._id}`
    );

    console.log(
      `Recovery Case ID: ${recoveryCase._id}`
    );

    console.log(
      `Amount: ₹${recoveryCase.amountAtRisk}`
    );

    console.log(
      `Payment ID: ${recoveryCase.paymentId?._id}`
    );

    console.log(
      `Current status: ${recoveryCase.status}`
    );

    console.log(
      "\n========================\n"
    );

    process.exit(0);
  } catch (error) {
    console.error(error.message);
    process.exit(1);
  }
};

findGoldenCase();