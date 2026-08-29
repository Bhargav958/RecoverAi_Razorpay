import AuditLog from "../models/AuditLog.js";
import getMerchant from "../utils/getMerchant.js";

const getAuditLogs = async (req, res) => {
  try {
    const merchant =
      await getMerchant(req.query.merchantId);

    const {
      page = 1,
      limit = 50,
      search = "",
      actor = "ALL",
      eventType = "ALL"
    } = req.query;

    const parsedPage =
      Math.max(Number(page) || 1, 1);

    const parsedLimit =
      Math.min(Math.max(Number(limit) || 50, 1), 100);

    const filter = {
      merchantId: merchant._id
    };

    if (actor && actor !== "ALL") {
      filter.actor = actor;
    }

    if (eventType && eventType !== "ALL") {
      filter.eventType = eventType;
    }

    if (search.trim()) {
      filter.$or = [
        {
          eventType: {
            $regex: search.trim(),
            $options: "i"
          }
        },
        {
          description: {
            $regex: search.trim(),
            $options: "i"
          }
        }
      ];
    }

    const [
      total,
      logs,
      actors,
      eventTypes
    ] = await Promise.all([
      AuditLog.countDocuments(filter),
      AuditLog.find(filter)
        .sort({ timestamp: -1 })
        .skip((parsedPage - 1) * parsedLimit)
        .limit(parsedLimit)
        .lean(),
      AuditLog.distinct("actor", {
        merchantId: merchant._id
      }),
      AuditLog.distinct("eventType", {
        merchantId: merchant._id
      })
    ]);

    res.status(200).json({
      success: true,
      data: {
        logs,
        filters: {
          actors,
          eventTypes
        },
        pagination: {
          page: parsedPage,
          limit: parsedLimit,
          total,
          totalPages:
            Math.max(Math.ceil(total / parsedLimit), 1)
        }
      }
    });
  } catch (error) {
    console.error("Get audit logs error:", error.message);

    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

export {
  getAuditLogs
};
