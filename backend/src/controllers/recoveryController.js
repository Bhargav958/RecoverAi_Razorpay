import RecoveryCase from "../models/RecoveryCase.js";
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
      const merchant =
        await getMerchant(
          req.query.merchantId
        );

      const {
        status,
        rootCause,
        minRisk,
        maxRisk,
        page = 1,
        limit = 25
      } = req.query;

      const filter = {
        merchantId: merchant._id
      };

      /*
       * Optional status filter
       */

      if (status) {
        filter.status = status;
      }

      /*
       * Optional root cause filter
       */

      if (rootCause) {
        filter.rootCause = rootCause;
      }

      /*
       * Optional risk filters
       */

      if ( minRisk !== undefined || maxRisk !== undefined ) {
        filter.riskScore = {};

        if ( minRisk !== undefined ) {
          filter.riskScore.$gte = Number(minRisk);
        }

        if ( maxRisk !== undefined ) {
          filter.riskScore.$lte = Number(maxRisk);
        }
      }

      const pageNumber =
        Math.max(
          Number(page), 1
        );

      const pageSize =
        Math.min(
          Math.max( Number(limit), 1 ), 100
        );

      const skip = (pageNumber - 1) * pageSize;

      const [ cases, total ] = await Promise.all([
        RecoveryCase.find(
          filter
        )
          .populate(
            "customerId",
            "name email lifetimeValue segment preferredChannel"
          )
          .populate(
            "paymentId",
            "amount status method failureCode failureReason isSimulation razorpayPaymentId razorpayOrderId"
          )
          .sort({
            priorityScore: -1,
            updatedAt: -1
          })
          .skip(skip)
          .limit(pageSize),

        RecoveryCase.countDocuments(
          filter
        )
      ]);

      res.status(200).json({
        success: true,

        data: {
          cases,

          pagination: {
            page: pageNumber,

            limit: pageSize,

            total,

            totalPages: Math.ceil( total / pageSize )
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