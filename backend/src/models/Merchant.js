import mongoose from "mongoose";

const merchantSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true
    },

    businessName: {
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

    currency: {
      type: String,
      default: "INR"
    },

    razorpayConnected: {
      type: Boolean,
      default: false
    },

    razorpayMode: {
      type: String,
      enum: ["test", "live"],
      default: "test"
    },

    isActive: {
      type: Boolean,
      default: true
    }
  },
  {
    timestamps: true
  }
);

const Merchant = mongoose.model("Merchant", merchantSchema);

export default Merchant;