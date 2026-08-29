import RecoveryAction from "../models/RecoveryAction.js";
import RecoveryCase from "../models/RecoveryCase.js";
import getMerchant from "../utils/getMerchant.js";
import { getRecoveryMetrics } from "../services/metricsService.js";

const getAnalytics = async (req, res) => {
  try {
    const merchant =
      await getMerchant(req.query.merchantId);

    const metrics =
      await getRecoveryMetrics(merchant._id);

    const [
      rootCauses,
      trend,
      actionPerformance
    ] = await Promise.all([
      RecoveryCase.aggregate([
        {
          $match: {
            merchantId: merchant._id
          }
        },

        /*
        |--------------------------------------------------------------------------
        | Join the linked payment
        |--------------------------------------------------------------------------
        */

        {
          $lookup: {
            from: "payments",
            localField: "paymentId",
            foreignField: "_id",
            as: "payment"
          }
        },

        {
          $unwind: {
            path: "$payment",
            preserveNullAndEmptyArrays: true
          }
        },

        /*
        |--------------------------------------------------------------------------
        | Determine the effective root cause
        |--------------------------------------------------------------------------
        |
        | Prefer the AI-diagnosed RecoveryCase root cause.
        |
        | If the case is still UNKNOWN, use the payment failure code
        | as a fallback so analytics remains informative.
        |
        |--------------------------------------------------------------------------
        */

        {
          $addFields: {
            effectiveRootCause: {
              $cond: [
                {
                  $and: [
                    {
                      $ne: [
                        "$rootCause",
                        "UNKNOWN"
                      ]
                    },
                    {
                      $ne: [
                        "$rootCause",
                        null
                      ]
                    }
                  ]
                },

                "$rootCause",

                {
                  $switch: {
                    branches: [
                      {
                        case: {
                          $eq: [
                            "$payment.failureCode",
                            "BANK_TEMPORARY_FAILURE"
                          ]
                        },
                        then:
                          "TEMPORARY_BANK_FAILURE"
                      },

                      {
                        case: {
                          $eq: [
                            "$payment.failureCode",
                            "INSUFFICIENT_FUNDS"
                          ]
                        },
                        then:
                          "INSUFFICIENT_FUNDS"
                      },

                      {
                        case: {
                          $eq: [
                            "$payment.failureCode",
                            "PAYMENT_METHOD_EXPIRED"
                          ]
                        },
                        then:
                          "EXPIRED_PAYMENT_METHOD"
                      },

                      {
                        case: {
                          $eq: [
                            "$payment.failureCode",
                            "AUTHENTICATION_FAILURE"
                          ]
                        },
                        then:
                          "AUTHENTICATION_FAILURE"
                      },

                      {
                        case: {
                          $eq: [
                            "$payment.failureCode",
                            "GATEWAY_TIMEOUT"
                          ]
                        },
                        then:
                          "GATEWAY_TIMEOUT"
                      }
                    ],

                    default:
                      "UNKNOWN"
                  }
                }
              ]
            }
          }
        },

        /*
        |--------------------------------------------------------------------------
        | Group by effective root cause
        |--------------------------------------------------------------------------
        */

        {
          $group: {
            _id: "$effectiveRootCause",

            cases: {
              $sum: 1
            },

            revenueAtRisk: {
              $sum: "$amountAtRisk"
            },

            recoveredAmount: {
              $sum: "$amountRecovered"
            },

            recoveredCases: {
              $sum: {
                $cond: [
                  {
                    $eq: [
                      "$status",
                      "RECOVERED"
                    ]
                  },
                  1,
                  0
                ]
              }
            }
          }
        },

        {
          $sort: {
            revenueAtRisk: -1
          }
        }
      ]),
      RecoveryCase.aggregate([
        {
          $match: {
            merchantId: merchant._id
          }
        },
        {
          $group: {
            _id: {
              $dateToString: {
                format: "%Y-%m-%d",
                date: "$updatedAt"
              }
            },
            recoveredAmount: {
              $sum: "$amountRecovered"
            },
            recoveredCases: {
              $sum: {
                $cond: [
                  { $eq: ["$status", "RECOVERED"] },
                  1,
                  0
                ]
              }
            },
            cases: {
              $sum: 1
            }
          }
        },
        {
          $sort: {
            _id: 1
          }
        },
        {
          $limit: 14
        }
      ]),
      RecoveryAction.aggregate([
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
              merchant._id
          }
        },
        {
          $group: {
            _id: "$actionType",
            attempts: {
              $sum: 1
            },
            succeeded: {
              $sum: {
                $cond: [
                  { $eq: ["$status", "SUCCEEDED"] },
                  1,
                  0
                ]
              }
            },
            recoveredAmount: {
              $sum: "$amountRecovered"
            }
          }
        },
        {
          $sort: {
            recoveredAmount: -1
          }
        }
      ])
    ]);

    const bestAction =
      actionPerformance[0] || null;

    const mostCommonRootCause =
      [...rootCauses].sort(
        (a, b) => b.cases - a.cases
      )[0] || null;

    const highestLeakageRootCause =
      rootCauses[0] || null;

    res.status(200).json({
      success: true,
      data: {
        metrics,
        rootCauses,
        trend,
        actionPerformance,
        insights: {
          bestAction,
          mostCommonRootCause,
          highestLeakageRootCause
        }
      }
    });
  } catch (error) {
    console.error("Get analytics error:", error.message);

    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

export {
  getAnalytics
};
