import getMerchant from "../utils/getMerchant.js";
import Policy from "../models/Policy.js";

const getMerchantPolicy = async (
  req,
  res
) => {
  try {
    const merchant =
      await getMerchant(
        req.query.merchantId
      );

    const policy =
      await Policy.findOne({
        merchantId:
          merchant._id
      });

    if (!policy) {
      return res.status(404).json({
        success: false,
        message:
          "Recovery policy not found"
      });
    }

    res.status(200).json({
      success: true,

      data: {
        merchant: {
          id: merchant._id,
          businessName:
            merchant.businessName
        },

        policy
      }
    });
  } catch (error) {
    console.error(
      "Get policy error:",
      error.message
    );

    res.status(500).json({
      success: false,
      message:
        error.message
    });
  }
};

export {
  getMerchantPolicy
};