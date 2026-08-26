import mongoose from "mongoose";

const paymentSchema = new mongoose.Schema(
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

    razorpayPaymentId: {
      type: String,
      required: true,
      trim: true
    },

    razorpayOrderId: {
      type: String,
      required: true,
      trim: true
    },

    amount: {
      type: Number,
      required: true,
      min: 0
    },

    currency: {
      type: String,
      default: "INR",
      trim: true
    },

    status: {
      type: String,
      enum: ["CREATED", "AUTHORIZED", "CAPTURED", "FAILED", "REFUNDED"],
      required: true,
      index: true
    },

    method: {
      type: String,
      trim: true
    },

    failureCode: {
      type: String,
      trim: true
    },

    failureReason: {
      type: String,
      trim: true
    },

    isSimulation: {
      type: Boolean,
      default: false
    },

    paidAt: {
      type: Date
    }
  },
  {
    timestamps: true
  }
);

const Payment = mongoose.model("Payment", paymentSchema);

export default Payment;