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

const updateMerchantPolicy = async (
  req,
  res
) => {
  try {
    const merchant =
      await getMerchant(
        req.body?.merchantId ||
          req.query.merchantId
      );

    const allowedFields = [
      "maxRetries",
      "minRetryIntervalHours",
      "maxMessages",
      "minMessageIntervalHours",
      "recoveryWindowDays",
      "humanEscalationThreshold",
      "minimumAIConfidence"
    ];

    const updates = {};

    for (const field of allowedFields) {
      if (req.body?.[field] != null) {
        const value =
          Number(req.body[field]);

        if (!Number.isFinite(value)) {
          return res.status(400).json({
            success: false,
            message:
              `${field} must be a number`
          });
        }

        updates[field] = value;
      }
    }

    if (
      updates.minimumAIConfidence != null &&
      (
        updates.minimumAIConfidence < 0 ||
        updates.minimumAIConfidence > 100
      )
    ) {
      return res.status(400).json({
        success: false,
        message:
          "minimumAIConfidence must be between 0 and 100"
      });
    }

    const policy =
      await Policy.findOneAndUpdate(
        {
          merchantId:
            merchant._id
        },
        {
          $set: updates
        },
        {
          new: true,
          runValidators: true
        }
      );

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
      "Update policy error:",
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
  getMerchantPolicy,
  updateMerchantPolicy
};
