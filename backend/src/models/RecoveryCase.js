import mongoose from "mongoose";

const recoveryCaseSchema = new mongoose.Schema(
  {
    merchantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Merchant",
      required: true,
      index: true
    },

    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Customer",
      required: true,
      index: true
    },

    paymentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Payment",
      required: true,
      unique: true,
      index: true
    },

    amountAtRisk: {
      type: Number,
      required: true,
      min: 0
    },

    riskScore: {
      type: Number,
      min: 0,
      max: 100,
      default: 0
    },

    recoveryProbability: {
      type: Number,
      min: 0,
      max: 100,
      default: 0
    },

    expectedRecovery: {
      type: Number,
      default: 0
    },

    priorityScore: {
      type: Number,
      default: 0
    },

    rootCause: {
      type: String,
      default: "UNKNOWN"
    },

    diagnosisConfidence: {
      type: Number,
      min: 0,
      max: 100,
      default: 0
    },

    recommendedAction: {
      type: String,
      enum: [
        "RETRY_PAYMENT",
        "REQUEST_PAYMENT_METHOD_UPDATE",
        "SEND_PAYMENT_LINK",
        "SEND_EMAIL",
        "SEND_SMS_OR_WHATSAPP",
        "HUMAN_ESCALATION",
        "STOP"
      ]
    },

    currentAction: {
      type: String
    },

    status: {
      type: String,
      enum: [
        "DETECTED",
        "ANALYZING",
        "ACTION_SELECTED",
        "PENDING_ACTION",
        "ACTION_EXECUTED",
        "VERIFYING",
        "RECOVERED",
        "FAILED",
        "ESCALATED",
        "STOPPED"
      ],
      default: "DETECTED",
      index: true
    },

    attempts: {
      type: Number,
      default: 0
    },

    amountRecovered: {
      type: Number,
      default: 0
    },

    nextActionAt: {
      type: Date
    },

    stoppedReason: {
      type: String
    },

    aiReason: {
      type: String
    },

    evidence: {
      type: [String],
      default: []
    },

    timeline: {
      type: [
        {
          event: String,
          description: String,
          timestamp: {
            type: Date,
            default: Date.now
          }
        }
      ],
      default: []
    }
  },
  {
    timestamps: true
  }
);

const RecoveryCase = mongoose.model(
  "RecoveryCase",
  recoveryCaseSchema
);

export default RecoveryCase;