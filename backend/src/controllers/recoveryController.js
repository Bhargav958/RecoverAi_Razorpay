import RecoveryCase from "../models/RecoveryCase.js";
import Customer from "../models/Customer.js";
import analyzeRecoveryCase from "../services/recoveryAnalysisService.js";
import processRecoveryCase from "../services/recoveryOrchestrator.js";

import getMerchant from "../utils/getMerchant.js";

import { getCaseAuditLogs } from "../services/auditService.js";

export const analyzeCase = async (req, res) => {
  try {
    const { id } = req.params;

    const result =
      await analyzeRecoveryCase(id);

    res.status(200).json({
      success: true,
      message: "Recovery case analyzed successfully",
      data: {
        recoveryCase: result.recoveryCase,
        risk: result.risk
      }
    });
  } catch (error) {
    console.error(
      "Recovery case analysis error:",
      error
    );

    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

export const getRecoveryCase = async (req, res) => {
  try {
    const { id } = req.params;

    const recoveryCase =
      await RecoveryCase.findById(id)
        .populate("customerId")
        .populate("paymentId");

    if (!recoveryCase) {
      return res.status(404).json({
        success: false,
        message: "Recovery case not found"
      });
    }

    res.status(200).json({
      success: true,
      data: recoveryCase
    });
  } catch (error) {
    console.error(
      "Get recovery case error:",
      error
    );

    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

export const processCase = async (req, res) => {
  try {
    const { id } = req.params;

    const result =
      await processRecoveryCase({
        recoveryCaseId: id,
        mode:
          req.body?.mode ||
          "SIMULATION"
      });

    res.status(200).json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error(
      "Recovery orchestration error:",
      error
    );

    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};


export const getRecoveryCases = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 25,
      search = "",
      status = "ALL",
      sort = "priority"
    } = req.query;

    const parsedPage = Math.max(
      Number(page) || 1,
      1
    );

    const parsedLimit = Math.min(
      Math.max(
        Number(limit) || 25,
        1
      ),
      100
    );

    const skip =
      (parsedPage - 1) *
      parsedLimit;

    /*
    |--------------------------------------------------------------------------
    | Find customers matching the search
    |--------------------------------------------------------------------------
    */

    let matchingCustomerIds = [];

    if (search.trim()) {
      const customerMatches =
        await Customer.find({
          $or: [
            {
              name: {
                $regex: search.trim(),
                $options: "i"
              }
            },
            {
              email: {
                $regex: search.trim(),
                $options: "i"
              }
            }
          ]
        }).select("_id");

      matchingCustomerIds =
        customerMatches.map(
          (customer) =>
            customer._id
        );
    }

    /*
    |--------------------------------------------------------------------------
    | Build RecoveryCase filter
    |--------------------------------------------------------------------------
    */

    const filter = {};

    /*
     * Status filter
     */

    if (
      status &&
      status !== "ALL"
    ) {
      filter.status = status;
    }

    /*
     * Search filter
     *
     * Search:
     * - customer name
     * - customer email
     * - root cause
     */

    if (search.trim()) {
      filter.$or = [
        {
          customerId: {
            $in: matchingCustomerIds
          }
        },
        {
          rootCause: {
            $regex: search.trim(),
            $options: "i"
          }
        }
      ];
    }

    /*
    |--------------------------------------------------------------------------
    | Sorting
    |--------------------------------------------------------------------------
    */

    let sortQuery = {
      priorityScore: -1,
      createdAt: 1
    };

    switch (sort) {
      case "risk":
        sortQuery = {
          riskScore: -1,
          createdAt: 1
        };
        break;

      case "amount":
        sortQuery = {
          amountAtRisk: -1,
          createdAt: 1
        };
        break;

      case "recovery":
        sortQuery = {
          recoveryProbability: -1,
          createdAt: 1
        };
        break;

      case "newest":
        sortQuery = {
          createdAt: -1
        };
        break;

      case "priority":
      default:
        sortQuery = {
          priorityScore: -1,
          createdAt: 1
        };
        break;
    }

    /*
    |--------------------------------------------------------------------------
    | Count + fetch page
    |--------------------------------------------------------------------------
    */

    const [
      total,
      cases
    ] = await Promise.all([
      RecoveryCase.countDocuments(
        filter
      ),

      RecoveryCase.find(filter)
        .populate(
          "customerId",
          "name email lifetimeValue segment preferredChannel"
        )
        .populate(
          "paymentId",
          "amount status method failureCode failureReason isSimulation razorpayPaymentId"
        )
        .sort(sortQuery)
        .skip(skip)
        .limit(parsedLimit)
    ]);

    const totalPages =
      Math.max(
        Math.ceil(
          total / parsedLimit
        ),
        1
      );

    res.status(200).json({
      success: true,

      data: {
        cases,

        pagination: {
          page: parsedPage,
          limit: parsedLimit,
          total,
          totalPages
        },

        filters: {
          search,
          status,
          sort
        }
      }
    });
  } catch (error) {
    console.error(
      "Get recovery cases error:",
      error.message
    );

    res.status(500).json({
      success: false,
      message:
        error.message
    });
  }
};
  

export const getRecoveryCaseAudit =
  async (req, res) => {
    try {
      const { id } = req.params;

      const logs =
        await getCaseAuditLogs(id);

      res.status(200).json({
        success: true,
        data: logs
      });
    } catch (error) {
      console.error(
        "Get recovery audit error:",
        error.message
      );

      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  };