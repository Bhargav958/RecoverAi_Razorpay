import AuditLog from "../models/AuditLog.js";

/*
|--------------------------------------------------------------------------
| Audit Service
|--------------------------------------------------------------------------
|
| Every important recovery decision/action should create an audit record.
|
|--------------------------------------------------------------------------
*/

const createAuditLog = async ({
  merchantId,
  recoveryCaseId,
  actor = "SYSTEM",
  eventType,
  description,
  metadata = {}
}) => {
  if (!merchantId) {
    throw new Error(
      "merchantId is required for audit log"
    );
  }

  if (!eventType) {
    throw new Error(
      "eventType is required for audit log"
    );
  }

  const audit = await AuditLog.create({
    merchantId,
    recoveryCaseId,
    actor,
    eventType,
    description,
    metadata,
    timestamp: new Date()
  });

  return audit;
};

const getCaseAuditLogs = async (
  recoveryCaseId
) => {
  return AuditLog.find({
    recoveryCaseId
  }).sort({
    timestamp: 1
  });
};

const getMerchantAuditLogs = async (
  merchantId,
  limit = 100
) => {
  return AuditLog.find({
    merchantId
  })
    .sort({
      timestamp: -1
    })
    .limit(limit);
};

export {
  createAuditLog,
  getCaseAuditLogs,
  getMerchantAuditLogs
};