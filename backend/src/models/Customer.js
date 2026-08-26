import mongoose from "mongoose";

const customerSchema = new mongoose.Schema(
  {
    merchantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Merchant",
      required: true,
      index: true
    },

    name: {
      type: String,
      required: true,
      trim: true
    },

    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true
    },

    phone: {
      type: String,
      trim: true
    },

    lifetimeValue: {
      type: Number,
      default: 0
    },

    totalPayments: {
      type: Number,
      default: 0
    },

    successfulPayments: {
      type: Number,
      default: 0
    },

    failedPayments: {
      type: Number,
      default: 0
    },

    previousRecoveries: {
      type: Number,
      default: 0
    },

    segment: {
      type: String,
      enum: [
        "HIGH_VALUE_HIGH_RECOVERABILITY",
        "HIGH_VALUE_LOW_RECOVERABILITY",
        "LOW_VALUE_HIGH_RECOVERABILITY",
        "LOW_VALUE_LOW_RECOVERABILITY"
      ],
      default: "LOW_VALUE_HIGH_RECOVERABILITY"
    },

    preferredChannel: {
      type: String,
      enum: ["EMAIL", "SMS", "WHATSAPP", "NONE"],
      default: "EMAIL"
    },

    subscriptionStatus: {
      type: String,
      enum: ["ACTIVE", "PAUSED", "CANCELLED", "NONE"],
      default: "NONE"
    },

    recoveryProbability: {
      type: Number,
      min: 0,
      max: 100,
      default: 0
    }
  },
  {
    timestamps: true
  }
);

const Customer = mongoose.model("Customer", customerSchema);

export default Customer;