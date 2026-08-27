import getMerchant from "../utils/getMerchant.js";
import {
  getMerchantAuditLogs
} from "../services/auditService.js";

const getAgentActivity = async (req, res) => {
  try {
    const merchant = await getMerchant(
      req.query.merchantId
    );

    const limit = Math.min(
      Math.max(
        Number(req.query.limit) || 30,
        1
      ),
      100
    );

    const logs = await getMerchantAuditLogs(
      merchant._id,
      limit
    );

    res.status(200).json({
      success: true,

      data: {
        activity: logs
      }
    });
  } catch (error) {
    console.error(
      "Agent activity error:",
      error.message
    );

    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

export {
  getAgentActivity
};