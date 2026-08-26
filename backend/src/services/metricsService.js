import RecoveryCase from "../models/RecoveryCase.js";
import Payment from "../models/Payment.js";

/*
|--------------------------------------------------------------------------
| Metrics Service
|--------------------------------------------------------------------------
|
| All merchant-level recovery metrics should be calculated from the
| database instead of being hard-coded in the frontend.
|
|--------------------------------------------------------------------------
*/

const getRevenueAtRisk = async (merchantId) => {
  const result = await RecoveryCase.aggregate([
    {
      $match: {
        merchantId
      }
    },
    {
      $match: {
        status: {
          $nin: ["RECOVERED", "STOPPED"]
        }
      }
    },
    {
      $group: {
        _id: null,
        total: {
          $sum: "$amountAtRisk"
        }
      }
    }
  ]);

  return result[0]?.total || 0;
};

const getTargetedRevenue = async (merchantId) => {
  const result = await RecoveryCase.aggregate([
    {
      $match: {
        merchantId,
        status: {
          $nin: ["DETECTED"]
        }
      }
    },
    {
      $group: {
        _id: null,
        total: {
          $sum: "$amountAtRisk"
        }
      }
    }
  ]);

  return result[0]?.total || 0;
};

const getAttemptedRevenue = async (merchantId) => {
  const result = await RecoveryCase.aggregate([
    {
      $match: {
        merchantId,
        attempts: {
          $gt: 0
        }
      }
    },
    {
      $group: {
        _id: null,
        total: {
          $sum: "$amountAtRisk"
        }
      }
    }
  ]);

  return result[0]?.total || 0;
};

const getRecoveredRevenue = async (merchantId) => {
  const result = await RecoveryCase.aggregate([
    {
      $match: {
        merchantId,
        amountRecovered: {
          $gt: 0
        }
      }
    },
    {
      $group: {
        _id: null,
        total: {
          $sum: "$amountRecovered"
        }
      }
    }
  ]);

  return result[0]?.total || 0;
};

const getRecoverableRevenue = async (merchantId) => {
  const result = await RecoveryCase.aggregate([
    {
      $match: {
        merchantId,
        status: {
          $nin: ["RECOVERED", "STOPPED"]
        }
      }
    },
    {
      $group: {
        _id: null,
        total: {
          $sum: "$expectedRecovery"
        }
      }
    }
  ]);

  return result[0]?.total || 0;
};

const getActiveCases = async (merchantId) => {
  return RecoveryCase.countDocuments({
    merchantId,
    status: {
      $nin: [
        "RECOVERED",
        "FAILED",
        "STOPPED"
      ]
    }
  });
};

const getCaseCount = async (merchantId) => {
  return RecoveryCase.countDocuments({
    merchantId
  });
};

const getRecoveredCaseCount = async (merchantId) => {
  return RecoveryCase.countDocuments({
    merchantId,
    status: "RECOVERED"
  });
};

const getRecoveryRate = (
  recoveredRevenue,
  targetedRevenue
) => {
  if (!targetedRevenue) {
    return 0;
  }

  return Number(
    (
      (recoveredRevenue /
        targetedRevenue) *
      100
    ).toFixed(2)
  );
};

const getRootCauseDistribution = async (
  merchantId
) => {
  return RecoveryCase.aggregate([
    {
      $match: {
        merchantId
      }
    },
    {
      $group: {
        _id: "$rootCause",
        cases: {
          $sum: 1
        },
        revenueAtRisk: {
          $sum: "$amountAtRisk"
        }
      }
    },
    {
      $sort: {
        revenueAtRisk: -1
      }
    }
  ]);
};

const getRecoveryMetrics = async (
  merchantId
) => {
  const [
    revenueAtRisk,
    recoverableRevenue,
    targetedRevenue,
    attemptedRevenue,
    recoveredRevenue,
    activeCases,
    caseCount,
    recoveredCaseCount,
    rootCauseDistribution
  ] = await Promise.all([
    getRevenueAtRisk(merchantId),
    getRecoverableRevenue(merchantId),
    getTargetedRevenue(merchantId),
    getAttemptedRevenue(merchantId),
    getRecoveredRevenue(merchantId),
    getActiveCases(merchantId),
    getCaseCount(merchantId),
    getRecoveredCaseCount(merchantId),
    getRootCauseDistribution(merchantId)
  ]);

  const recoveryRate =
    getRecoveryRate(
      recoveredRevenue,
      targetedRevenue
    );

  return {
    revenueAtRisk,
    recoverableRevenue,
    targetedRevenue,
    attemptedRevenue,
    recoveredRevenue,
    recoveryRate,
    activeCases,
    caseCount,
    recoveredCaseCount,
    rootCauseDistribution
  };
};

export {
  getRevenueAtRisk,
  getRecoverableRevenue,
  getTargetedRevenue,
  getAttemptedRevenue,
  getRecoveredRevenue,
  getActiveCases,
  getRecoveryRate,
  getRecoveryMetrics
};