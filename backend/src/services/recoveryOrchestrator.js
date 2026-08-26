import RecoveryCase from "../models/RecoveryCase.js";
import Customer from "../models/Customer.js";

import { calculateRisk } from "./riskEngine.js";
import diagnosePaymentFailure from "./diagnosePaymentFailure.js";
import evaluatePolicy from "./policyEngine.js";
import recoveryActionService from "./recoveryActionService.js";

const processRecoveryCase = async ({
  recoveryCaseId,
  mode = "SIMULATION"
}) => {
  const recoveryCase =
    await RecoveryCase.findById(recoveryCaseId);

  if (!recoveryCase) {
    throw new Error("Recovery case not found");
  }

  /*
  |--------------------------------------------------------------------------
  | Safety: don't process an already terminal case
  |--------------------------------------------------------------------------
  */

  if (
    ["RECOVERED", "STOPPED"].includes(
      recoveryCase.status
    )
  ) {
    return {
      success: true,
      message:
        `Recovery case is already in terminal state: ${recoveryCase.status}`,
      recoveryCase
    };
  }

  const customer =
    await Customer.findById(
      recoveryCase.customerId
    );

  if (!customer) {
    throw new Error(
      "Customer not found"
    );
  }

  /*
  |--------------------------------------------------------------------------
  | STEP 1 — Risk Analysis
  |--------------------------------------------------------------------------
  */

  recoveryCase.status = "ANALYZING";

  const risk = calculateRisk({
    payment: await getPayment(recoveryCase),
    customer
  });

  recoveryCase.riskScore = risk.riskScore;

  recoveryCase.recoveryProbability =  risk.recoveryProbability;

  recoveryCase.expectedRecovery = risk.expectedRecovery;

  recoveryCase.priorityScore = risk.priorityScore;

  recoveryCase.timeline.push({
    event: "RISK_ANALYSIS_COMPLETED",

    description:
      `Risk score ${risk.riskScore}/100. Recovery probability ${risk.recoveryProbability}%.`,

    timestamp: new Date()
  });

  await recoveryCase.save();

  /*
  |--------------------------------------------------------------------------
  | STEP 2 — AI Diagnosis
  |--------------------------------------------------------------------------
  */

  const payment =
    await getPayment(recoveryCase);

  const diagnosisResult =
    await diagnosePaymentFailure({
      payment,
      customer,
      risk
    });

  const diagnosis = diagnosisResult.diagnosis;

  recoveryCase.rootCause =  diagnosis.rootCause;

  recoveryCase.diagnosisConfidence = diagnosis.confidence;

  recoveryCase.recommendedAction = diagnosis.recommendedAction;

  recoveryCase.currentAction = diagnosis.recommendedAction;

  recoveryCase.aiReason = diagnosis.reason;

  recoveryCase.evidence =  diagnosis.evidence;

  recoveryCase.timeline.push({
    event: "AI_DIAGNOSIS_COMPLETED",

    description:
      `Root cause ${diagnosis.rootCause}. Recommended action ${diagnosis.recommendedAction}. Confidence ${diagnosis.confidence}%.`,

    timestamp: new Date()
  });

  await recoveryCase.save();

  /*
  |--------------------------------------------------------------------------
  | STEP 3 — Policy Evaluation
  |--------------------------------------------------------------------------
  */

  const policyResult =
    await evaluatePolicy({
      recoveryCase,
      customer,
      diagnosis
    });

  recoveryCase.timeline.push({
    event: policyResult.allowed
      ? "POLICY_APPROVED"
      : "POLICY_REJECTED",

    description: policyResult.reason,

    timestamp: new Date()
  });

  await recoveryCase.save();

  /*
  |--------------------------------------------------------------------------
  | STEP 4 — Execute / Schedule Action
  |--------------------------------------------------------------------------
  */

  const actionResult =
    await recoveryActionService({
      recoveryCase,
      policyResult,
      mode
    });

  return {
    success: true,

    mode,

    risk,

    diagnosis: diagnosisResult,

    policy: policyResult,

    action: actionResult,

    recoveryCase:
      actionResult.recoveryCase
  };
};

/*
|--------------------------------------------------------------------------
| Payment lookup helper
|--------------------------------------------------------------------------
*/

import Payment from "../models/Payment.js";

const getPayment = async (
  recoveryCase
) => {
  const payment =
    await Payment.findById(
      recoveryCase.paymentId
    );

  if (!payment) {
    throw new Error(
      "Payment not found for recovery case"
    );
  }

  return payment;
};

export default processRecoveryCase;