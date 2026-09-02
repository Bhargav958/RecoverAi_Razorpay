import dotenv from "dotenv";
import connectDB from "../config/db.js";
import Merchant from "../models/Merchant.js";

dotenv.config();

const updateMerchant = async () => {
  try {
    await connectDB();
    const result = await Merchant.updateMany(
      {},
      {
        $set: {
          businessName: "IIITT SaaS",
          name: "IIITT SaaS Merchant"
        }
      }
    );
    console.log("Merchant name updated successfully:", result);
    process.exit(0);
  } catch (error) {
    console.error("Error updating merchant:", error.message);
    process.exit(1);
  }
};

updateMerchant();
