import mongoose from "mongoose";

const webhookEventSchema = new mongoose.Schema(
  {
    eventId: {
      type: String,
      required: true,
      unique: true,
      index: true
    },

    merchantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Merchant",
      required: true,
      index: true
    },

    eventType: {
      type: String,
      required: true,
      index: true
    },

    paymentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Payment",
      default: null
    },

    razorpayPaymentId: {
      type: String,
      default: null,
      index: true
    },

    payload: {
      type: mongoose.Schema.Types.Mixed,
      required: true
    },

    processed: {
      type: Boolean,
      default: false
    },

    processedAt: {
      type: Date,
      default: null
    },

    error: {
      type: String,
      default: null
    }
  },
  {
    timestamps: true
  }
);

const WebhookEvent =
  mongoose.model(
    "WebhookEvent",
    webhookEventSchema
  );

export default WebhookEvent;