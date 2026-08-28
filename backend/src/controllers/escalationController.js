import RecoveryCase from "../models/RecoveryCase.js";

import {
  createAuditLog
} from "../services/auditService.js";

/*
|--------------------------------------------------------------------------
| Approve Escalated Case
|--------------------------------------------------------------------------
*/

const approveEscalatedCase = async (
  req,
  res
) => {
  try {
    const { id } = req.params;

    const recoveryCase =
      await RecoveryCase.findById(id);

    if (!recoveryCase) {
      return res.status(404).json({
        success: false,
        message:
          "Recovery case not found"
      });
    }

    if (
      recoveryCase.status !==
      "ESCALATED"
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Only ESCALATED cases can be approved."
      });
    }

    recoveryCase.status =
      "ACTION_SELECTED";

    recoveryCase.currentAction =
      recoveryCase.recommendedAction;

    recoveryCase.stoppedReason =
      null;

    recoveryCase.timeline.push({
      event:
        "HUMAN_APPROVAL_GRANTED",

      description:
        "Merchant approved the AI-recommended recovery action.",

      timestamp: new Date()
    });

    await recoveryCase.save();

    await createAuditLog({
      merchantId:
        recoveryCase.merchantId,

      recoveryCaseId:
        recoveryCase._id,

      actor:
        "MERCHANT",

      eventType:
        "HUMAN_APPROVAL_GRANTED",

      description:
        "Merchant approved the recovery action after human review.",

      metadata: {
        action:
          recoveryCase.recommendedAction
      }
    });

    res.status(200).json({
      success: true,

      data: {
        recoveryCase
      }
    });
  } catch (error) {
    console.error(
      "Approve escalation error:",
      error.message
    );

    res.status(500).json({
      success: false,
      message:
        error.message
    });
  }
};

/*
|--------------------------------------------------------------------------
| Reject / Stop Escalated Case
|--------------------------------------------------------------------------
*/

const rejectEscalatedCase = async (
  req,
  res
) => {
  try {
    const { id } = req.params;

    const recoveryCase =
      await RecoveryCase.findById(id);

    if (!recoveryCase) {
      return res.status(404).json({
        success: false,
        message:
          "Recovery case not found"
      });
    }

    if (
      recoveryCase.status !==
      "ESCALATED"
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Only ESCALATED cases can be rejected."
      });
    }

    recoveryCase.status =
      "STOPPED";

    recoveryCase.currentAction =
      null;

    recoveryCase.nextActionAt =
      null;

    recoveryCase.stoppedReason =
      "Merchant rejected the recovery action.";

    recoveryCase.timeline.push({
      event:
        "HUMAN_REVIEW_REJECTED",

      description:
        "Merchant rejected the recovery action after human review.",

      timestamp: new Date()
    });

    await recoveryCase.save();

    await createAuditLog({
      merchantId:
        recoveryCase.merchantId,

      recoveryCaseId:
        recoveryCase._id,

      actor:
        "MERCHANT",

      eventType:
        "HUMAN_REVIEW_REJECTED",

      description:
        "Merchant rejected the AI-recommended recovery action.",

      metadata: {
        action:
          recoveryCase.recommendedAction
      }
    });

    res.status(200).json({
      success: true,

      data: {
        recoveryCase
      }
    });
  } catch (error) {
    console.error(
      "Reject escalation error:",
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
  approveEscalatedCase,
  rejectEscalatedCase
};