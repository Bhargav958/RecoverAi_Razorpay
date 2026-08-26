import RecoveryAction from "../models/RecoveryAction.js";
import RecoveryCase from "../models/RecoveryCase.js";

const recoveryActionService = async ({
  recoveryCase,
  customer,
  policyResult,
  mode = "SIMULATION"
}) => {
  if (!recoveryCase) {
    throw new Error(
      "Recovery case is required"
    );
  }

  if (!policyResult) {
    throw new Error(
      "Policy result is required"
    );
  }

  /*
  |--------------------------------------------------------------------------
  | Policy rejected the action
  |--------------------------------------------------------------------------
  */

  if (!policyResult.allowed) {
    const rejectedAction =
      await RecoveryAction.create({
        recoveryCaseId:
          recoveryCase._id,

        actionType:
          policyResult.action,

        targetChannel:
          policyResult.action ===
          "HUMAN_ESCALATION"
            ? "HUMAN"
            : "RAZORPAY",

        reason:
          policyResult.reason,

        status: "REJECTED",

        costTier:
          policyResult.action ===
          "HUMAN_ESCALATION"
            ? "HIGH"
            : "LOW"
      });

    recoveryCase.timeline.push({
      event: "ACTION_REJECTED_BY_POLICY",

      description:
        policyResult.reason,

      timestamp: new Date()
    });

    /*
     * If policy requires a human,
     * move the case to ESCALATED.
     */

    if (
      policyResult.requiresHumanApproval
    ) {
      recoveryCase.status =
        "ESCALATED";
    } else {
      recoveryCase.status =
        "STOPPED";

      recoveryCase.stoppedReason =
        policyResult.reason;
    }

    await recoveryCase.save();

    return {
      success: false,
      executed: false,
      action: rejectedAction
    };
  }

  /*
  |--------------------------------------------------------------------------
  | Determine action type
  |--------------------------------------------------------------------------
  */

  const actionType =
    policyResult.action;

  let targetChannel = "RAZORPAY";

  if (actionType === "SEND_EMAIL") {
    targetChannel = "EMAIL";
  }

  if (actionType === "SEND_SMS_OR_WHATSAPP") {
    targetChannel =
      customer?.preferredChannel === "WHATSAPP"
        ? "WHATSAPP"
        : "SMS";
  }

  if (actionType === "SEND_PAYMENT_LINK") {
    targetChannel = "RAZORPAY";
  }

  if (actionType === "HUMAN_ESCALATION") {
    targetChannel = "HUMAN";
  }

  /*
  |--------------------------------------------------------------------------
  | Determine cost tier
  |--------------------------------------------------------------------------
  */

  let costTier = "LOW";

  if (
    actionType ===
      "SEND_SMS_OR_WHATSAPP" ||
    actionType ===
      "SEND_PAYMENT_LINK"
  ) {
    costTier = "MEDIUM";
  }

  if (
    actionType ===
    "HUMAN_ESCALATION"
  ) {
    costTier = "HIGH";
  }

  /*
  |--------------------------------------------------------------------------
  | SIMULATION MODE
  |--------------------------------------------------------------------------
  |
  | No real customer communication or payment action happens.
  |
  */

  if (mode === "SIMULATION") {
    const scheduledAt =
      policyResult.scheduledAt ||
      null

    const action =
      await RecoveryAction.create({
        recoveryCaseId:
          recoveryCase._id,

        actionType,

        targetChannel,

        reason:
          policyResult.reason,

        status:
          policyResult.scheduledAt
            ? "SCHEDULED"
            : "EXECUTED",

        costTier,

        scheduledAt,

        executedAt:
        policyResult.scheduledAt
          ? null
          : new Date()
      });

    /*
     * Increment attempts only when an actual
     * recovery attempt is being executed.
     *
     * A scheduled retry is not yet an attempt.
     */

    if (!policyResult.scheduledAt) {
      recoveryCase.attempts += 1;
    }

    recoveryCase.currentAction =
      actionType;

    recoveryCase.nextActionAt =
      policyResult.scheduledAt;

    recoveryCase.status =
      policyResult.scheduledAt
        ? "PENDING_ACTION"
        : "ACTION_EXECUTED";

    recoveryCase.timeline.push({
      event:
        policyResult.scheduledAt
          ? "ACTION_SCHEDULED"
          : "ACTION_EXECUTED",

      description:
        `${actionType} ${policyResult.scheduledAt ? "scheduled" : "simulated successfully"}.`,

      timestamp: new Date()
    });

    await recoveryCase.save();

    return {
      success: true,
      executed:
        !policyResult.scheduledAt,
      scheduled:
        Boolean(
          policyResult.scheduledAt
        ),
      action,
      mode
    };
  }

  /*
  |--------------------------------------------------------------------------
  | LIVE MODE
  |--------------------------------------------------------------------------
  |
  | We intentionally don't call Razorpay directly here yet.
  | The Razorpay integration will be added through a dedicated
  | provider service.
  |
  */

  if (mode === "LIVE") {
    throw new Error(
      "LIVE recovery execution is not implemented yet. Use SIMULATION mode."
    );
  }

  throw new Error(
    `Unsupported recovery mode: ${mode}`
  );
};

export default recoveryActionService;