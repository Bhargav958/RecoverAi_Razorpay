import mongoose from "mongoose";

const auditLogSchema = new mongoose.Schema(
  {
    merchantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Merchant",
      required: true,
      index: true
    },

    recoveryCaseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "RecoveryCase",
      index: true
    },

    actor: {
      type: String,
      enum: [
        "SYSTEM",
        "AI_AGENT",
        "POLICY_ENGINE",
        "MERCHANT",
        "RAZORPAY",
        "SIMULATION"
      ],
      default: "SYSTEM"
    },

    eventType: {
      type: String,
      required: true,
      index: true
    },

    description: {
      type: String,
      required: true
    },

    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {}
    },

    timestamp: {
      type: Date,
      default: Date.now,
      index: true
    }
  },
  {
    timestamps: false
  }
);

const AuditLog = mongoose.model(
  "AuditLog",
  auditLogSchema
);

export default AuditLog;