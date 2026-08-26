import RecoveryCase from "../models/RecoveryCase.js";
import analyzeRecoveryCase from "../services/recoveryAnalysisService.js";

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