import mongoose from "mongoose";

const recoveryActionSchema = new mongoose.Schema(
  {
    recoveryCaseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "RecoveryCase",
      required: true,
      index: true
    },

    actionType: {
      type: String,
      enum: [
        "RETRY_PAYMENT",
        "REQUEST_PAYMENT_METHOD_UPDATE",
        "SEND_PAYMENT_LINK",
        "SEND_EMAIL",
        "SEND_SMS_OR_WHATSAPP",
        "HUMAN_ESCALATION"
      ],
      required: true
    },

    targetChannel: {
      type: String,
      enum: [
        "RAZORPAY",
        "EMAIL",
        "SMS",
        "WHATSAPP",
        "HUMAN"
      ]
    },

    reason: {
      type: String
    },

    status: {
      type: String,
      enum: [
        "SCHEDULED",
        "PENDING",
        "EXECUTED",
        "SUCCEEDED",
        "FAILED",
        "REJECTED"
      ],
      default: "PENDING"
    },

    costTier: {
      type: String,
      enum: ["LOW", "MEDIUM", "HIGH"],
      default: "LOW"
    },

    scheduledAt: {
      type: Date
    },

    executedAt: {
      type: Date
    },

    result: {
      type: String
    },

    amountRecovered: {
      type: Number,
      default: 0
    },

    providerReference: {
      type: String
    }
  },
  {
    timestamps: true
  }
);

const RecoveryAction = mongoose.model(
  "RecoveryAction",
  recoveryActionSchema
);

export default RecoveryAction;