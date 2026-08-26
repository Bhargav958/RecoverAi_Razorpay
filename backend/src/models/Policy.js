import mongoose from "mongoose";

const policySchema = new mongoose.Schema(
  {
    merchantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Merchant",
      required: true,
      unique: true
    },

    maxRetries: {
      type: Number,
      default: 3,
      min: 0
    },

    minRetryIntervalHours: {
      type: Number,
      default: 6,
      min: 0
    },

    maxMessages: {
      type: Number,
      default: 3,
      min: 0
    },

    minMessageIntervalHours: {
      type: Number,
      default: 24,
      min: 0
    },

    recoveryWindowDays: {
      type: Number,
      default: 7,
      min: 1
    },

    humanEscalationThreshold: {
      type: Number,
      default: 25000,
      min: 0
    },

    minimumAIConfidence: {
      type: Number,
      default: 60,
      min: 0,
      max: 100
    }
  },
  {
    timestamps: true
  }
);

const Policy = mongoose.model("Policy", policySchema);

export default Policy;