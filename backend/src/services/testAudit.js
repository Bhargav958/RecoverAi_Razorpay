import dotenv from "dotenv";

import connectDB from "../config/db.js";
import Merchant from "../models/Merchant.js";
import RecoveryCase from "../models/RecoveryCase.js";

import {
  createAuditLog,
  getCaseAuditLogs
} from "./auditService.js";

dotenv.config();

const testAudit = async () => {
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

    const recoveryCase =
      await RecoveryCase.findOne({
        merchantId:
          merchant._id
      }).sort({
        updatedAt: -1
      });

    if (!recoveryCase) {
      throw new Error(
        "Recovery case not found"
      );
    }

    const audit =
      await createAuditLog({
        merchantId:
          merchant._id,

        recoveryCaseId:
          recoveryCase._id,

        actor:
          "SYSTEM",

        eventType:
          "TEST_AUDIT_EVENT",

        description:
          "Audit service successfully recorded an event.",

        metadata: {
          test: true
        }
      });

    const logs =
      await getCaseAuditLogs(
        recoveryCase._id
      );

    console.log(
      "\n===== RECOVERAI AUDIT TEST =====\n"
    );

    console.log(
      "Created Audit ID:",
      audit._id
    );

    console.log(
      "Recovery Case:",
      recoveryCase._id
    );

    console.log(
      "Total case audit logs:",
      logs.length
    );

    console.log(
      "\nLatest audit:"
    );

    console.log(
      JSON.stringify(
        logs[logs.length - 1],
        null,
        2
      )
    );

    console.log(
      "\n================================\n"
    );

    process.exit(0);
  } catch (error) {
    console.error(
      "\nAudit test failed:"
    );

    console.error(
      error.message
    );

    process.exit(1);
  }
};

testAudit();