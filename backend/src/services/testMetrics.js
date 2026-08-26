import dotenv from "dotenv";

import connectDB from "../config/db.js";
import Merchant from "../models/Merchant.js";

import {
  getRecoveryMetrics
} from "./metricsService.js";

dotenv.config();

const testMetrics = async () => {
  try {
    await connectDB();

    const merchant =
      await Merchant.findOne({
        businessName: "Acme SaaS"
      });

    if (!merchant) {
      throw new Error(
        "Acme SaaS merchant not found"
      );
    }

    const metrics =
      await getRecoveryMetrics(
        merchant._id
      );

    console.log(
      "\n===== RECOVERAI METRICS =====\n"
    );

    console.log(
      "Merchant:",
      merchant.businessName
    );

    console.log(
      "Revenue at Risk:",
      `₹${metrics.revenueAtRisk.toLocaleString("en-IN")}`
    );

    console.log(
      "Recoverable Revenue:",
      `₹${metrics.recoverableRevenue.toLocaleString("en-IN")}`
    );

    console.log(
      "Targeted Revenue:",
      `₹${metrics.targetedRevenue.toLocaleString("en-IN")}`
    );

    console.log(
      "Attempted Revenue:",
      `₹${metrics.attemptedRevenue.toLocaleString("en-IN")}`
    );

    console.log(
      "Recovered Revenue:",
      `₹${metrics.recoveredRevenue.toLocaleString("en-IN")}`
    );

    console.log(
      "Recovery Rate:",
      `${metrics.recoveryRate}%`
    );

    console.log(
      "Active Cases:",
      metrics.activeCases
    );

    console.log(
      "Total Cases:",
      metrics.caseCount
    );

    console.log(
      "Recovered Cases:",
      metrics.recoveredCaseCount
    );

    console.log(
      "\nRoot Cause Distribution:"
    );

    console.log(
      JSON.stringify(
        metrics.rootCauseDistribution,
        null,
        2
      )
    );

    console.log(
      "\n=============================\n"
    );

    process.exit(0);
  } catch (error) {
    console.error(
      "\nMetrics test failed:"
    );

    console.error(
      error.message
    );

    process.exit(1);
  }
};

testMetrics();