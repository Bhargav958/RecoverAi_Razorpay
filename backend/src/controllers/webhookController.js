import getMerchant from "../utils/getMerchant.js";
import WebhookEvent from "../models/WebhookEvent.js";

const getWebhookStatus = async (
  req,
  res
) => {
  try {
    const merchant =
      await getMerchant(
        req.query.merchantId
      );

    const [
      total,
      processed,
      failed,
      latest
    ] = await Promise.all([
      WebhookEvent.countDocuments({
        merchantId:
          merchant._id
      }),

      WebhookEvent.countDocuments({
        merchantId:
          merchant._id,
        processed: true
      }),

      WebhookEvent.countDocuments({
        merchantId:
          merchant._id,
        processed: false,
        error: {
          $ne: null
        }
      }),

      WebhookEvent.findOne({
        merchantId:
          merchant._id
      })
        .sort({
          createdAt: -1
        })
        .select(
          "eventId eventType processed processedAt error createdAt"
        )
    ]);

    res.status(200).json({
      success: true,

      data: {
        configured:
          Boolean(
            process.env
              .RAZORPAY_WEBHOOK_SECRET
          ),

        total,

        processed,

        failed,

        latest
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message:
        error.message
    });
  }
};

export {
  getWebhookStatus
};
