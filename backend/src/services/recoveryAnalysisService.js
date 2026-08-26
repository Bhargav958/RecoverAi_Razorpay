import RecoveryCase from "../models/RecoveryCase.js";
import Payment from "../models/Payment.js";
import Customer from "../models/Customer.js";

import { calculateRisk } from "./riskEngine.js";
import diagnosePaymentFailure from "./diagnosePaymentFailure.js";

const analyzeRecoveryCase = async (recoveryCaseId) => {
  const recoveryCase =
    await RecoveryCase.findById(recoveryCaseId);

  if (!recoveryCase) {
    throw new Error("Recovery case not found");
  }

  const payment =
    await Payment.findById(
      recoveryCase.paymentId
    );

  if (!payment) {
    throw new Error(
      "Payment not found for recovery case"
    );
  }

  const customer =
    await Customer.findById(
      recoveryCase.customerId
    );

  if (!customer) {
    throw new Error(
      "Customer not found for recovery case"
    );
  }

  /*
  |--------------------------------------------------------------------------
  | Step 1: Deterministic Risk Analysis
  |--------------------------------------------------------------------------
  */

  const risk =
    calculateRisk({
      payment,
      customer
    });

  recoveryCase.status =
    "ANALYZING";

  recoveryCase.riskScore =
    risk.riskScore;

  recoveryCase.recoveryProbability =
    risk.recoveryProbability;

  recoveryCase.expectedRecovery =
    risk.expectedRecovery;

  recoveryCase.priorityScore =
    risk.priorityScore;

  recoveryCase.timeline.push({
    event: "RISK_ANALYSIS_COMPLETED",

    description:
      `Risk analysis completed. Risk: ${risk.riskScore}/100, Recovery probability: ${risk.recoveryProbability}%`,

    timestamp: new Date()
  });

  /*
  |--------------------------------------------------------------------------
  | Step 2: AI Diagnosis
  |--------------------------------------------------------------------------
  */

  const diagnosisResult =
    await diagnosePaymentFailure({
      payment,
      customer,
      risk
    });

  const diagnosis =
    diagnosisResult.diagnosis;

  recoveryCase.rootCause =
    diagnosis.rootCause;

  recoveryCase.diagnosisConfidence =
    diagnosis.confidence;

  recoveryCase.recommendedAction =
    diagnosis.recommendedAction;

  recoveryCase.currentAction =
    diagnosis.recommendedAction;

  recoveryCase.aiReason =
    diagnosis.reason;

  recoveryCase.evidence =
    diagnosis.evidence;

  /*
  |--------------------------------------------------------------------------
  | Step 3: Store AI diagnosis in timeline
  |--------------------------------------------------------------------------
  */

  recoveryCase.timeline.push({
    event: "AI_DIAGNOSIS_COMPLETED",

    description:
      `Root cause: ${diagnosis.rootCause}. Recommended action: ${diagnosis.recommendedAction}. Confidence: ${diagnosis.confidence}%`,

    timestamp: new Date()
  });

  /*
  |--------------------------------------------------------------------------
  | Step 4: Schedule retry if AI recommends one
  |--------------------------------------------------------------------------
  */

  if (
    diagnosis.recommendedAction ===
      "RETRY_PAYMENT" &&
    diagnosis.delayHours > 0
  ) {
    recoveryCase.nextActionAt =
      new Date(
        Date.now() +
          diagnosis.delayHours *
            60 *
            60 *
            1000
      );
  }

  /*
  |--------------------------------------------------------------------------
  | Step 5: Move to action-selected state
  |--------------------------------------------------------------------------
  */

  recoveryCase.status =
    "ACTION_SELECTED";

  recoveryCase.timeline.push({
    event: "RECOVERY_ACTION_SELECTED",

    description:
      `Action selected: ${diagnosis.recommendedAction}`,

    timestamp: new Date()
  });

  await recoveryCase.save();

  return {
    recoveryCase,
    payment,
    customer,
    risk,
    diagnosis: diagnosisResult
  };
};

export default analyzeRecoveryCase;