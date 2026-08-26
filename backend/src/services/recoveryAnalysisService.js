import RecoveryCase from "../models/RecoveryCase.js";
import Payment from "../models/Payment.js";
import Customer from "../models/Customer.js";

import { calculateRisk } from "./riskEngine.js";

const analyzeRecoveryCase = async (recoveryCaseId) => {
  const recoveryCase = await RecoveryCase.findById(
    recoveryCaseId
  );

  if (!recoveryCase) {
    throw new Error("Recovery case not found");
  }

  const payment = await Payment.findById(
    recoveryCase.paymentId
  );

  if (!payment) {
    throw new Error("Payment not found for recovery case");
  }

  const customer = await Customer.findById(
    recoveryCase.customerId
  );

  if (!customer) {
    throw new Error("Customer not found for recovery case");
  }

  const riskResult = calculateRisk({
    payment,
    customer
  });

  recoveryCase.status = "ANALYZING";

  recoveryCase.riskScore = riskResult.riskScore;

  recoveryCase.recoveryProbability = riskResult.recoveryProbability;

  recoveryCase.expectedRecovery = riskResult.expectedRecovery;

  recoveryCase.priorityScore = riskResult.priorityScore;

  recoveryCase.timeline.push({
    event: "RISK_ANALYSIS_COMPLETED",
    description:
      `Risk analysis completed. Risk: ${riskResult.riskScore}/100, Recovery probability: ${riskResult.recoveryProbability}%`,
    timestamp: new Date()
  });

  await recoveryCase.save();

  return {
    recoveryCase,
    payment,
    customer,
    risk: riskResult
  };
};

export default analyzeRecoveryCase;