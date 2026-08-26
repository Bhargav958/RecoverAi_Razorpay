import RecoveryCase from "../models/RecoveryCase.js";
import Customer from "../models/Customer.js";
import Payment from "../models/Payment.js";

import { calculateRisk } from "./riskEngine.js";
import diagnosePaymentFailure from "./diagnosePaymentFailure.js";
import evaluatePolicy from "./policyEngine.js";
import recoveryActionService from "./recoveryActionService.js";
import { createAuditLog } from "./auditService.js";

/*
|--------------------------------------------------------------------------
| Recovery Orchestrator
|--------------------------------------------------------------------------
|
| Main recovery workflow:
|
| Detect
|   ↓
| Risk Analysis
|   ↓
| AI Diagnosis
|   ↓
| Policy Evaluation
|   ↓
| Recovery Action
|
| Execution + Verification happen in separate services.
|
|--------------------------------------------------------------------------
*/

const processRecoveryCase = async ({
  recoveryCaseId,
  mode = "SIMULATION"
}) => {
  /*
  |--------------------------------------------------------------------------
  | STEP 0 — Load Recovery Case
  |--------------------------------------------------------------------------
  */

  const recoveryCase =
    await RecoveryCase.findById(
      recoveryCaseId
    );

  if (!recoveryCase) {
    throw new Error(
      "Recovery case not found"
    );
  }

  /*
  |--------------------------------------------------------------------------
  | Terminal state protection
  |--------------------------------------------------------------------------
  |
  | Don't process an already completed case.
  |
  */

  if (
    [
      "RECOVERED",
      "STOPPED"
    ].includes(
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

  /*
  |--------------------------------------------------------------------------
  | Load Customer
  |--------------------------------------------------------------------------
  */

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
  | Load Payment
  |--------------------------------------------------------------------------
  */

  const payment =
    await Payment.findById(
      recoveryCase.paymentId
    );

  if (!payment) {
    throw new Error(
      "Payment not found for recovery case"
    );
  }

  /*
  |--------------------------------------------------------------------------
  | STEP 1 — Risk Analysis
  |--------------------------------------------------------------------------
  */

  recoveryCase.status =
    "ANALYZING";

  const risk =
    calculateRisk({
      payment,
      customer
    });

  recoveryCase.riskScore =
    risk.riskScore;

  recoveryCase.recoveryProbability =
    risk.recoveryProbability;

  recoveryCase.expectedRecovery =
    risk.expectedRecovery;

  recoveryCase.priorityScore =
    risk.priorityScore;

  recoveryCase.timeline.push({
    event:
      "RISK_ANALYSIS_COMPLETED",

    description:
      `Risk score ${risk.riskScore}/100. Recovery probability ${risk.recoveryProbability}%.`,

    timestamp: new Date()
  });

  await recoveryCase.save();

  /*
  |--------------------------------------------------------------------------
  | Audit — Risk Analysis
  |--------------------------------------------------------------------------
  */

  await createAuditLog({
    merchantId:
      recoveryCase.merchantId,

    recoveryCaseId:
      recoveryCase._id,

    actor:
      "SYSTEM",

    eventType:
      "RISK_ANALYSIS_COMPLETED",

    description:
      `Risk score ${risk.riskScore}/100. Recovery probability ${risk.recoveryProbability}%.`,

    metadata: {
      riskScore:
        risk.riskScore,

      recoveryProbability:
        risk.recoveryProbability,

      expectedRecovery:
        risk.expectedRecovery,

      priorityScore:
        risk.priorityScore
    }
  });

  /*
  |--------------------------------------------------------------------------
  | STEP 2 — AI Diagnosis
  |--------------------------------------------------------------------------
  */

  const diagnosisResult =
    await diagnosePaymentFailure({
      payment,
      customer,
      risk
    });

  /*
   * IMPORTANT:
   * Declare diagnosis immediately after receiving the result.
   * Nothing above this point should reference `diagnosis`.
   */

  const diagnosis =
    diagnosisResult.diagnosis;

  /*
  |--------------------------------------------------------------------------
  | Store AI diagnosis
  |--------------------------------------------------------------------------
  */

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

  recoveryCase.timeline.push({
    event:
      "AI_DIAGNOSIS_COMPLETED",

    description:
      `Root cause ${diagnosis.rootCause}. Recommended action ${diagnosis.recommendedAction}. Confidence ${diagnosis.confidence}%.`,

    timestamp: new Date()
  });

  await recoveryCase.save();

  /*
  |--------------------------------------------------------------------------
  | Audit — AI Diagnosis
  |--------------------------------------------------------------------------
  */

  await createAuditLog({
    merchantId:
      recoveryCase.merchantId,

    recoveryCaseId:
      recoveryCase._id,

    actor:
      "AI_AGENT",

    eventType:
      "AI_DIAGNOSIS_COMPLETED",

    description:
      `Root cause ${diagnosis.rootCause}. Recommended action ${diagnosis.recommendedAction}. Confidence ${diagnosis.confidence}%.`,

    metadata: {
      source:
        diagnosisResult.source,

      rootCause:
        diagnosis.rootCause,

      confidence:
        diagnosis.confidence,

      recommendedAction:
        diagnosis.recommendedAction,

      delayHours:
        diagnosis.delayHours,

      reason:
        diagnosis.reason,

      evidence:
        diagnosis.evidence,

      requiresHumanApproval:
        diagnosis.requiresHumanApproval
    }
  });

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
    event:
      policyResult.allowed
        ? "POLICY_APPROVED"
        : "POLICY_REJECTED",

    description:
      policyResult.reason,

    timestamp: new Date()
  });

  await recoveryCase.save();

  /*
  |--------------------------------------------------------------------------
  | Audit — Policy Decision
  |--------------------------------------------------------------------------
  */

  await createAuditLog({
    merchantId:
      recoveryCase.merchantId,

    recoveryCaseId:
      recoveryCase._id,

    actor:
      "POLICY_ENGINE",

    eventType:
      policyResult.allowed
        ? "POLICY_APPROVED"
        : "POLICY_REJECTED",

    description:
      policyResult.reason,

    metadata: {
      allowed:
        policyResult.allowed,

      action:
        policyResult.action,

      scheduledAt:
        policyResult.scheduledAt,

      requiresHumanApproval:
        policyResult.requiresHumanApproval,

      violations:
        policyResult.violations
    }
  });

  /*
  |--------------------------------------------------------------------------
  | STEP 4 — Recovery Action
  |--------------------------------------------------------------------------
  */

  const actionResult =
    await recoveryActionService({
      recoveryCase,
      customer,
      policyResult,
      mode
    });

  /*
  |--------------------------------------------------------------------------
  | Audit — Recovery Action
  |--------------------------------------------------------------------------
  */

  if (actionResult.action) {
    await createAuditLog({
      merchantId:
        recoveryCase.merchantId,

      recoveryCaseId:
        recoveryCase._id,

      actor:
        mode === "SIMULATION"
          ? "SIMULATION"
          : "SYSTEM",

      eventType:
        actionResult.scheduled
          ? "ACTION_SCHEDULED"
          : actionResult.executed
            ? "ACTION_EXECUTED"
            : "ACTION_REJECTED",

      description:
        actionResult.action.reason ||
        "Recovery action processed.",

      metadata: {
        actionType:
          actionResult.action.actionType,

        targetChannel:
          actionResult.action.targetChannel,

        status:
          actionResult.action.status,

        scheduledAt:
          actionResult.action.scheduledAt,

        executedAt:
          actionResult.action.executedAt,

        amountRecovered:
          actionResult.action.amountRecovered
      }
    });
  }

  /*
  |--------------------------------------------------------------------------
  | Return complete workflow state
  |--------------------------------------------------------------------------
  */

  return {
    success: true,

    mode,

    risk,

    diagnosis:
      diagnosisResult,

    policy:
      policyResult,

    action:
      actionResult,

    recoveryCase:
      actionResult.recoveryCase
  };
};

export default processRecoveryCase;