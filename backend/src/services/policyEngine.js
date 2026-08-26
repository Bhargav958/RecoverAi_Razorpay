import Policy from "../models/Policy.js";

/*
|--------------------------------------------------------------------------
| Policy Engine
|--------------------------------------------------------------------------
|
| The AI recommends an action.
| This service decides whether that action is allowed.
|
| IMPORTANT:
| The AI never directly executes financial or communication actions.
| Every recommendation passes through this policy layer.
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

  /*
  |--------------------------------------------------------------------------
  | Load merchant policy
  |--------------------------------------------------------------------------
  */

  const policy = await Policy.findOne({
    merchantId: recoveryCase.merchantId
  });

  if (!policy) {
    throw new Error(
      "Merchant recovery policy not found"
    );
  }

  /*
  |--------------------------------------------------------------------------
  | Extract AI recommendation
  |--------------------------------------------------------------------------
  */

  const {
    recommendedAction,
    confidence,
    delayHours
  } = diagnosis;

  /*
  |--------------------------------------------------------------------------
  | Base result
  |--------------------------------------------------------------------------
  */

  const result = {
    allowed: true,

    action: recommendedAction,

    scheduledAt: null,

    requiresHumanApproval: false,

    reason: "Action is allowed by merchant policy.",

    violations: []
  };

  /*
  |--------------------------------------------------------------------------
  | Communication action detection
  |--------------------------------------------------------------------------
  |
  | IMPORTANT:
  | This must be declared BEFORE it is used.
  |
  */

  const communicationActionsRequested = [
    "SEND_EMAIL",
    "SEND_SMS_OR_WHATSAPP",
    "SEND_PAYMENT_LINK"
  ].includes(recommendedAction);

  /*
  |--------------------------------------------------------------------------
  | Count previous communication attempts
  |--------------------------------------------------------------------------
  */

  const communicationActions =
    recoveryCase.timeline.filter(
      (event) =>
        event.event === "EMAIL_SENT" ||
        event.event === "SMS_SENT" ||
        event.event === "WHATSAPP_SENT" ||
        event.event === "PAYMENT_LINK_SENT"
    ).length;

  /*
  |--------------------------------------------------------------------------
  | RULE 1 — Minimum AI confidence
  |--------------------------------------------------------------------------
  */

  if (
    typeof confidence !== "number" ||
    confidence < policy.minimumAIConfidence
  ) {
    result.allowed = false;

    result.requiresHumanApproval = true;

    result.action = "HUMAN_ESCALATION";

    result.reason =
      `AI confidence ${confidence}% is below the merchant minimum of ${policy.minimumAIConfidence}%.`;

    result.violations.push(
      "AI confidence below policy threshold"
    );

    return result;
  }

  /*
  |--------------------------------------------------------------------------
  | RULE 2 — Explicit human escalation
  |--------------------------------------------------------------------------
  */

  if (
    recommendedAction === "HUMAN_ESCALATION"
  ) {
    result.allowed = true;

    result.requiresHumanApproval = true;

    result.action = "HUMAN_ESCALATION";

    result.reason =
      "The AI recommends human escalation.";

    return result;
  }

  /*
  |--------------------------------------------------------------------------
  | RULE 3 — High-value case
  |--------------------------------------------------------------------------
  |
  | High-value recovery cases require human approval.
  |
  */

  if (
    recoveryCase.amountAtRisk >=
    policy.humanEscalationThreshold
  ) {
    result.allowed = false;

    result.requiresHumanApproval = true;

    result.action = "HUMAN_ESCALATION";

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
  | RULE 4 — Retry payment
  |--------------------------------------------------------------------------
  */

  if (
    recommendedAction === "RETRY_PAYMENT"
  ) {
    /*
     * Maximum retry attempts.
     */

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
     * Merchant's minimum retry interval.
     */

    const minimumRetryTime =
      new Date(
        Date.now() +
          policy.minRetryIntervalHours *
            60 *
            60 *
            1000
      );

    /*
     * AI-requested delay.
     */

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
       * Never schedule earlier than the
       * merchant's minimum retry interval.
       */

      requestedRetryTime =
        aiRequestedTime >
        minimumRetryTime
          ? aiRequestedTime
          : minimumRetryTime;
    }

    result.scheduledAt =
      requestedRetryTime;

    result.reason =
      `Retry approved. Action scheduled according to the merchant minimum retry interval of ${policy.minRetryIntervalHours} hours.`;

    return result;
  }

  /*
  |--------------------------------------------------------------------------
  | RULE 5 — Communication limit
  |--------------------------------------------------------------------------
  */

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
  | RULE 6 — Delayed communication
  |--------------------------------------------------------------------------
  |
  | Example:
  |
  | AI:
  | SEND_SMS_OR_WHATSAPP
  | delayHours = 24
  |
  | Policy:
  | Allowed
  |
  | Result:
  | scheduledAt = now + 24 hours
  |
  */

  if (
    communicationActionsRequested &&
    typeof delayHours === "number" &&
    delayHours > 0
  ) {
    result.scheduledAt =
      new Date(
        Date.now() +
          delayHours *
            60 *
            60 *
            1000
      );

    result.reason =
      `Communication action scheduled after ${delayHours} hour(s) according to the AI recommendation.`;

    return result;
  }

  /*
  |--------------------------------------------------------------------------
  | RULE 7 — Immediate communication
  |--------------------------------------------------------------------------
  */

  if (communicationActionsRequested) {
    result.allowed = true;

    result.reason =
      "Communication action is within merchant policy.";

    return result;
  }

  /*
  |--------------------------------------------------------------------------
  | RULE 8 — Explicit STOP
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
  | DEFAULT
  |--------------------------------------------------------------------------
  */

  return result;
};

export default evaluatePolicy;