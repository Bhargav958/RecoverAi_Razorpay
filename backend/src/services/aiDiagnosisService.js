import dotenv from "dotenv";
import { GoogleGenAI } from "@google/genai";

dotenv.config();

/*
|--------------------------------------------------------------------------
| Gemini Client
|--------------------------------------------------------------------------
*/

const ai = process.env.AI_API_KEY
  ? new GoogleGenAI({
      apiKey: process.env.AI_API_KEY
    })
  : null;

/*
|--------------------------------------------------------------------------
| Allowed Values
|--------------------------------------------------------------------------
*/

const ALLOWED_ROOT_CAUSES = [
  "TEMPORARY_BANK_FAILURE",
  "EXPIRED_PAYMENT_METHOD",
  "INSUFFICIENT_FUNDS",
  "AUTHENTICATION_FAILURE",
  "GATEWAY_TIMEOUT",
  "REPEATED_FAILURE",
  "UNKNOWN"
];

const ALLOWED_ACTIONS = [
  "RETRY_PAYMENT",
  "REQUEST_PAYMENT_METHOD_UPDATE",
  "SEND_PAYMENT_LINK",
  "SEND_EMAIL",
  "SEND_SMS_OR_WHATSAPP",
  "HUMAN_ESCALATION",
  "STOP"
];

/*
|--------------------------------------------------------------------------
| Gemini Structured Output Schema
|--------------------------------------------------------------------------
|
| We force Gemini to return predictable JSON instead of free-form text.
|
*/

const diagnosisSchema = {
  type: "object",

  properties: {
    rootCause: {
      type: "string",
      enum: ALLOWED_ROOT_CAUSES
    },

    confidence: {
      type: "integer",
      minimum: 0,
      maximum: 100
    },

    recommendedAction: {
      type: "string",
      enum: ALLOWED_ACTIONS
    },

    delayHours: {
      type: "integer",
      minimum: 0
    },

    reason: {
      type: "string"
    },

    evidence: {
      type: "array",

      items: {
        type: "string"
      }
    },

    requiresHumanApproval: {
      type: "boolean"
    }
  },

  required: [
    "rootCause",
    "confidence",
    "recommendedAction",
    "delayHours",
    "reason",
    "evidence",
    "requiresHumanApproval"
  ]
};

/*
|--------------------------------------------------------------------------
| Deterministic Fallback
|--------------------------------------------------------------------------
|
| If Gemini is unavailable, RecoverAI must still be able to make
| a conservative diagnosis.
|
*/

const deterministicFallback = ({
  payment,
  customer
}) => {
  let rootCause = "UNKNOWN";

  let recommendedAction =
    "HUMAN_ESCALATION";

  let confidence = 50;

  let delayHours = 0;

  let reason =
    "AI analysis was unavailable, so the deterministic fallback rules were used.";

  let evidence = [];

  switch (payment.failureCode) {
    case "BANK_TEMPORARY_FAILURE":
      rootCause =
        "TEMPORARY_BANK_FAILURE";

      recommendedAction =
        "RETRY_PAYMENT";

      confidence = 85;

      delayHours = 6;

      reason =
        "The payment appears to have failed because of a temporary bank-side issue, so a delayed retry is appropriate.";

      evidence = [
        "Failure code indicates a temporary bank failure",
        `Customer has ${customer.successfulPayments} successful payments`
      ];

      break;

    case "CARD_EXPIRED":
      rootCause =
        "EXPIRED_PAYMENT_METHOD";

      recommendedAction =
        "REQUEST_PAYMENT_METHOD_UPDATE";

      confidence = 92;

      reason =
        "The payment method appears to be expired, so the customer should update it before another payment attempt.";

      evidence = [
        "Payment failure indicates an expired payment method"
      ];

      break;

    case "INSUFFICIENT_FUNDS":
      rootCause =
        "INSUFFICIENT_FUNDS";

      recommendedAction =
        "SEND_PAYMENT_LINK";

      confidence = 80;

      reason =
        "The payment could not be completed because sufficient funds were unavailable. A payment link gives the customer another opportunity to pay.";

      evidence = [
        "Payment failure indicates insufficient funds"
      ];

      break;

    case "AUTHENTICATION_FAILED":
      rootCause =
        "AUTHENTICATION_FAILURE";

      recommendedAction =
        "SEND_PAYMENT_LINK";

      confidence = 75;

      reason =
        "Payment authentication did not complete successfully.";

      evidence = [
        "Authentication failure detected"
      ];

      break;

    case "GATEWAY_TIMEOUT":
      rootCause =
        "GATEWAY_TIMEOUT";

      recommendedAction =
        "RETRY_PAYMENT";

      confidence = 82;

      delayHours = 6;

      reason =
        "A gateway timeout may be temporary, so a delayed retry is appropriate.";

      evidence = [
        "Gateway timeout detected"
      ];

      break;

    default:
      rootCause = "UNKNOWN";

      recommendedAction =
        "HUMAN_ESCALATION";

      confidence = 50;

      reason =
        "The failure could not be confidently classified.";

      evidence = [
        "No recognized failure code was available"
      ];
  }

  /*
   * Additional customer context
   */

  if (customer.successfulPayments >= 10) {
    evidence.push(
      "Customer has a strong successful payment history"
    );
  }

  if (customer.failedPayments >= 5) {
    evidence.push(
      "Customer has multiple previous payment failures"
    );
  }

  if (customer.lifetimeValue >= 100000) {
    evidence.push(
      "Customer has high lifetime value"
    );
  }

  /*
   * Low-confidence fallback decisions should be conservative.
   */

  const requiresHumanApproval =
    confidence < 60 ||
    recommendedAction ===
      "HUMAN_ESCALATION";

  return {
    rootCause,
    confidence,
    recommendedAction,
    delayHours,
    reason,
    evidence,
    requiresHumanApproval
  };
};

/*
|--------------------------------------------------------------------------
| Main AI Diagnosis Function
|--------------------------------------------------------------------------
*/

const diagnosePaymentFailure = async ({
  payment,
  customer,
  risk
}) => {
  /*
   * No API key → deterministic fallback
   */

  if (!ai) {
    return {
      source: "FALLBACK",

      diagnosis:
        deterministicFallback({
          payment,
          customer
        })
    };
  }

  const prompt = `
You are the diagnosis component of RecoverAI,
an AI-powered revenue recovery platform for merchants.

Your job is to analyze ONE failed payment and determine:
1. The most likely root cause.
2. How confident you are.
3. The safest appropriate recovery action.
4. Whether the action should be delayed.
5. Why that action is appropriate.
6. What evidence supports the decision.
7. Whether human approval is required.

IMPORTANT RULES:

- Use ONLY the supplied information.
- Never invent customer history.
- Never invent payment information.
- Never execute an action.
- Never suggest unlimited retries.
- Never suggest unlimited customer communication.
- Prefer conservative actions.
- If evidence is weak, use HUMAN_ESCALATION.
- Return only the structured response.

PAYMENT INFORMATION

Amount: ₹${payment.amount}
Status: ${payment.status}
Payment Method: ${payment.method || "UNKNOWN"}
Failure Code: ${payment.failureCode || "UNKNOWN"}
Failure Reason: ${payment.failureReason || "UNKNOWN"}

CUSTOMER INFORMATION

Name: ${customer.name}
Lifetime Value: ₹${customer.lifetimeValue}
Total Payments: ${customer.totalPayments}
Successful Payments: ${customer.successfulPayments}
Failed Payments: ${customer.failedPayments}
Previous Recoveries: ${customer.previousRecoveries}
Preferred Channel: ${customer.preferredChannel}

RISK ENGINE RESULTS

Risk Score: ${risk.riskScore}/100
Recovery Probability: ${risk.recoveryProbability}%
Expected Recovery: ₹${risk.expectedRecovery}
Priority Score: ${risk.priorityScore}

Analyze this case and return the structured diagnosis.
`;

  try {
    const response =
      await ai.models.generateContent({
        model: "gemini-2.5-flash",

        contents: prompt,

        config: {
          responseMimeType:
            "application/json",

          responseSchema:
            diagnosisSchema
        }
      });

    const diagnosis =
      JSON.parse(response.text);

    /*
     * Extra defensive validation.
     */

    if (
      !ALLOWED_ROOT_CAUSES.includes(
        diagnosis.rootCause
      )
    ) {
      throw new Error(
        "AI returned an invalid root cause"
      );
    }

    if (
      !ALLOWED_ACTIONS.includes(
        diagnosis.recommendedAction
      )
    ) {
      throw new Error(
        "AI returned an invalid recovery action"
      );
    }

    if (
      diagnosis.confidence < 0 ||
      diagnosis.confidence > 100
    ) {
      throw new Error(
        "AI returned invalid confidence"
      );
    }

    return {
      source: "AI",
      diagnosis
    };
  } catch (error) {
    console.error(
      "Gemini diagnosis failed:",
      error.message
    );

    return {
      source: "FALLBACK",

      diagnosis:
        deterministicFallback({
          payment,
          customer
        })
    };
  }
};

export {
  diagnosePaymentFailure,
  deterministicFallback
};

export default diagnosePaymentFailure;