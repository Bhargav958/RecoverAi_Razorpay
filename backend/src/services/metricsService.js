import RecoveryCase from "../models/RecoveryCase.js";
import RecoveryAction from "../models/RecoveryAction.js";

/*
|--------------------------------------------------------------------------
| Revenue at Risk
|--------------------------------------------------------------------------
|
| Revenue that is currently sitting inside non-terminal recovery cases.
|
*/

const getRevenueAtRisk = async (merchantId) => {
  const result = await RecoveryCase.aggregate([
    {
      $match: {
        merchantId,
        status: {
          $nin: [
            "RECOVERED",
            "STOPPED"
          ]
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

/*
|--------------------------------------------------------------------------
| Recoverable Revenue
|--------------------------------------------------------------------------
|
| Sum of expected recovery for cases that are still active.
|
*/

const getRecoverableRevenue = async (
  merchantId
) => {
  const result = await RecoveryCase.aggregate([
    {
      $match: {
        merchantId,
        status: {
          $nin: [
            "RECOVERED",
            "STOPPED"
          ]
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

/*
|--------------------------------------------------------------------------
| Targeted Revenue
|--------------------------------------------------------------------------
|
| Revenue belonging to cases that have actually entered the
| recovery workflow.
|
*/

const getTargetedRevenue = async (
  merchantId
) => {
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

/*
|--------------------------------------------------------------------------
| Attempted Revenue
|--------------------------------------------------------------------------
|
| Count each recovery case only once, even if the case had
| multiple recovery actions.
|
*/

const getAttemptedRevenue = async (
  merchantId
) => {
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

/*
|--------------------------------------------------------------------------
| Recovered Revenue
|--------------------------------------------------------------------------
|
| IMPORTANT:
|
| Actual recovered money comes from successfully completed
| recovery actions.
|
| This prevents duplicate counting when a case has more than
| one action.
|
*/

const getRecoveredRevenue = async (
  merchantId
) => {
  const result = await RecoveryAction.aggregate([
    {
      $match: {
        status: "SUCCEEDED",
        amountRecovered: {
          $gt: 0
        }
      }
    },
    {
      $lookup: {
        from: "recoverycases",
        localField: "recoveryCaseId",
        foreignField: "_id",
        as: "recoveryCase"
      }
    },
    {
      $unwind: "$recoveryCase"
    },
    {
      $match: {
        "recoveryCase.merchantId":
          merchantId
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

/*
|--------------------------------------------------------------------------
| Active Cases
|--------------------------------------------------------------------------
*/

const getActiveCases = async (
  merchantId
) => {
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

/*
|--------------------------------------------------------------------------
| Total Cases
|--------------------------------------------------------------------------
*/

const getCaseCount = async (
  merchantId
) => {
  return RecoveryCase.countDocuments({
    merchantId
  });
};

/*
|--------------------------------------------------------------------------
| Recovered Cases
|--------------------------------------------------------------------------
*/

const getRecoveredCaseCount = async (
  merchantId
) => {
  return RecoveryCase.countDocuments({
    merchantId,
    status: "RECOVERED"
  });
};

/*
|--------------------------------------------------------------------------
| Recovery Rate
|--------------------------------------------------------------------------
*/

const getRecoveryRate = (
  recoveredRevenue,
  targetedRevenue
) => {
  if (
    !targetedRevenue ||
    targetedRevenue <= 0
  ) {
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

/*
|--------------------------------------------------------------------------
| Root Cause Distribution
|--------------------------------------------------------------------------
*/

const getRootCauseDistribution =
  async (merchantId) => {
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

/*
|--------------------------------------------------------------------------
| Master Metrics Function
|--------------------------------------------------------------------------
*/

const getRecoveryMetrics =
  async (merchantId) => {
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
      getRevenueAtRisk(
        merchantId
      ),

      getRecoverableRevenue(
        merchantId
      ),

      getTargetedRevenue(
        merchantId
      ),

      getAttemptedRevenue(
        merchantId
      ),

      getRecoveredRevenue(
        merchantId
      ),

      getActiveCases(
        merchantId
      ),

      getCaseCount(
        merchantId
      ),

      getRecoveredCaseCount(
        merchantId
      ),

      getRootCauseDistribution(
        merchantId
      )
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