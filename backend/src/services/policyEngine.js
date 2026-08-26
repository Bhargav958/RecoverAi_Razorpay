import Policy from "../models/Policy.js";

/*
|--------------------------------------------------------------------------
| Policy Engine
|--------------------------------------------------------------------------
|
| The AI recommends an action.
| This service decides whether that action is allowed.
|
| The AI never bypasses this layer.
|
|--------------------------------------------------------------------------
*/

const evaluatePolicy = async ({
  recoveryCase,
  customer,
  diagnosis
}) => {
  if (!recoveryCase) {
    throw new Error(
      "Recovery case is required for policy evaluation"
    );
  }

  if (!customer) {
    throw new Error(
      "Customer is required for policy evaluation"
    );
  }

  if (!diagnosis) {
    throw new Error(
      "AI diagnosis is required for policy evaluation"
    );
  }

  const policy = await Policy.findOne({
    merchantId: recoveryCase.merchantId
  });

  if (!policy) {
    throw new Error(
      "Merchant recovery policy not found"
    );
  }

  const {
    recommendedAction,
    confidence,
    delayHours
  } = diagnosis;

  /*
  |--------------------------------------------------------------------------
  | Result object
  |--------------------------------------------------------------------------
  */

  const result = {
    allowed: true,
    action: recommendedAction,
    scheduledAt: null,
    requiresHumanApproval: false,
    reason: "Action is allowed by policy.",
    violations: []
  };

  /*
  |--------------------------------------------------------------------------
  | Rule 1 — Minimum AI confidence
  |--------------------------------------------------------------------------
  */

  if (
    typeof confidence !== "number" ||
    confidence < policy.minimumAIConfidence
  ) {
    result.allowed = false;

    result.requiresHumanApproval = true;

    result.action =
      "HUMAN_ESCALATION";

    result.reason =
      `AI confidence ${confidence}% is below the merchant minimum of ${policy.minimumAIConfidence}%.`;

    result.violations.push(
      "AI confidence below policy threshold"
    );

    return result;
  }

  /*
  |--------------------------------------------------------------------------
  | Rule 2 — Human escalation
  |--------------------------------------------------------------------------
  */

  if (
    recommendedAction ===
    "HUMAN_ESCALATION"
  ) {
    result.allowed = true;

    result.requiresHumanApproval = true;

    result.action =
      "HUMAN_ESCALATION";

    result.reason =
      "The AI recommends human escalation.";

    return result;
  }

  /*
  |--------------------------------------------------------------------------
  | Rule 3 — High-value transactions
  |--------------------------------------------------------------------------
  */

  if (
    recoveryCase.amountAtRisk >=
    policy.humanEscalationThreshold
  ) {
    /*
     * Don't automatically retry or message high-value
     * cases unless the merchant policy explicitly permits
     * automated handling.
     *
     * For our initial safe implementation, require human
     * approval.
     */

    result.allowed = false;

    result.requiresHumanApproval = true;

    result.action =
      "HUMAN_ESCALATION";

    result.reason =
      `Amount at risk ₹${recoveryCase.amountAtRisk.toLocaleString(
        "en-IN"
      )} exceeds the merchant escalation threshold of ₹${policy.humanEscalationThreshold.toLocaleString(
        "en-IN"
      )}.`;

    result.violations.push(
      "High-value case requires human approval"
    );

    return result;
  }

  /*
  |--------------------------------------------------------------------------
  | Rule 4 — Maximum retry attempts
  |--------------------------------------------------------------------------
  */

  if (
    recommendedAction ===
    "RETRY_PAYMENT"
  ) {
    if (
      recoveryCase.attempts >=
      policy.maxRetries
    ) {
      result.allowed = false;

      result.action = "STOP";

      result.reason =
        `Maximum retry limit of ${policy.maxRetries} has been reached.`;

      result.violations.push(
        "Maximum retry attempts reached"
      );

      return result;
    }

    /*
     * Calculate next allowed retry time.
     */

    const minimumRetryTime =
      new Date(
        Date.now() +
          policy.minRetryIntervalHours *
            60 *
            60 *
            1000
      );

    let requestedRetryTime =
      minimumRetryTime;

    if (
      typeof delayHours === "number" &&
      delayHours > 0
    ) {
      const aiRequestedTime =
        new Date(
          Date.now() +
            delayHours *
              60 *
              60 *
              1000
        );

      /*
       * We choose the later of:
       *
       * AI requested delay
       * Merchant minimum retry interval
       */

      if (
        aiRequestedTime >
        minimumRetryTime
      ) {
        requestedRetryTime =
          aiRequestedTime;
      }
    }

    result.scheduledAt =
      requestedRetryTime;

    result.reason =
      `Retry permitted. Next attempt scheduled after the merchant minimum retry interval of ${policy.minRetryIntervalHours} hours.`;

    return result;
  }

  /*
  |--------------------------------------------------------------------------
  | Rule 5 — Communication limits
  |--------------------------------------------------------------------------
  |
  | Count previous communication actions from the RecoveryCase
  | timeline. For now we use timeline events as the source.
  |
  */

  const communicationActions =
    recoveryCase.timeline.filter(
      (event) =>
        event.event ===
          "EMAIL_SENT" ||
        event.event ===
          "SMS_SENT" ||
        event.event ===
          "WHATSAPP_SENT" ||
        event.event ===
          "PAYMENT_LINK_SENT"
    ).length;

  const communicationActionsRequested =
    [
      "SEND_EMAIL",
      "SEND_SMS_OR_WHATSAPP",
      "SEND_PAYMENT_LINK"
    ].includes(recommendedAction);

  if (
    communicationActionsRequested &&
    communicationActions >=
      policy.maxMessages
  ) {
    result.allowed = false;

    result.action = "STOP";

    result.reason =
      `Maximum communication limit of ${policy.maxMessages} has been reached.`;

    result.violations.push(
      "Maximum communication attempts reached"
    );

    return result;
  }

  /*
  |--------------------------------------------------------------------------
  | Rule 6 — Payment link / communication
  |--------------------------------------------------------------------------
  */

  if (
    communicationActionsRequested
  ) {
    result.allowed = true;

    result.reason =
      "Communication action is within merchant policy.";

    return result;
  }

  /*
  |--------------------------------------------------------------------------
  | Rule 7 — Explicit STOP recommendation
  |--------------------------------------------------------------------------
  */

  if (
    recommendedAction === "STOP"
  ) {
    result.allowed = true;

    result.action = "STOP";

    result.reason =
      "The AI recommends stopping recovery.";

    return result;
  }

  /*
  |--------------------------------------------------------------------------
  | Default
  |--------------------------------------------------------------------------
  */

  return result;
};

export default evaluatePolicy;