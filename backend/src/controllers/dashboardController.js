import getMerchant from "../utils/getMerchant.js";

import { getRecoveryMetrics } from "../services/metricsService.js";

import RecoveryCase from "../models/RecoveryCase.js";

const getDashboardSummary = async (req,res) => {
  try {
    const merchant =
      await getMerchant(
        req.query.merchantId
      );

    const metrics =
      await getRecoveryMetrics(
        merchant._id
      );

    /*
     * Get most recent recovery cases.
     */

    const recentCases =
      await RecoveryCase.find({
        merchantId:
          merchant._id
      })
        .populate(
          "customerId",
          "name email lifetimeValue"
        )
        .populate(
          "paymentId",
          "amount status method failureReason"
        )
        .sort({
          updatedAt: -1
        })
        .limit(10);

    res.status(200).json({
      success: true,

      data: {
        merchant: {
          id: merchant._id,
          name: merchant.name,
          businessName:  merchant.businessName,
          currency:  merchant.currency,
          razorpayConnected:  merchant.razorpayConnected,
          razorpayMode:  merchant.razorpayMode
        },

        metrics,

        recentCases
      }
    });
  } catch (error) {
    console.error(
      "Dashboard summary error:",
      error.message
    );

    res.status(500).json({
      success: false,
      message:
        error.message
    });
  }
};

const getRootCauses = async (
  req,
  res
) => {
  try {
    const merchant =
      await getMerchant(
        req.query.merchantId
      );

    const metrics =
      await getRecoveryMetrics(
        merchant._id
      );

    res.status(200).json({
      success: true,

      data: {
        rootCauseDistribution:
          metrics.rootCauseDistribution
      }
    });
  } catch (error) {
    console.error(
      "Root cause analytics error:",
      error.message
    );

    res.status(500).json({
      success: false,
      message:
        error.message
    });
  }
};

const getRecoveryPerformance =
  async (req, res) => {
    try {
      const merchant =
        await getMerchant(
          req.query.merchantId
        );

      const metrics =
        await getRecoveryMetrics(
          merchant._id
        );

      /*
       * For now the performance endpoint returns the
       * merchant-level totals.
       *
       * Later we'll add date-based trend aggregation.
       */

      res.status(200).json({
        success: true,

        data: {
          revenueAtRisk: metrics.revenueAtRisk,

          recoverableRevenue: metrics.recoverableRevenue,

          targetedRevenue: metrics.targetedRevenue,

          attemptedRevenue: metrics.attemptedRevenue,

          recoveredRevenue:  metrics.recoveredRevenue,

          recoveryRate: metrics.recoveryRate,

          activeCases:  metrics.activeCases,

          totalCases:  metrics.caseCount,

          recoveredCases: metrics.recoveredCaseCount
        }
      });
    } catch (error) {
      console.error(
        "Recovery performance error:",
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
  getDashboardSummary,
  getRootCauses,
  getRecoveryPerformance
};