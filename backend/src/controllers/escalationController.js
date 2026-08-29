import RecoveryCase from "../models/RecoveryCase.js";
import RecoveryAction from "../models/RecoveryAction.js";

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

    const existingAction =
      await RecoveryAction.findOne({
        recoveryCaseId:
          recoveryCase._id,

        status: {
          $in: [
            "SCHEDULED",
            "PENDING",
            "EXECUTED",
            "SUCCEEDED"
          ]
        }
      });

    if (existingAction) {
      return res.status(409).json({
        success: false,
        message:
          "This case already has an active recovery action."
      });
    }

    const approvedAction =
      await RecoveryAction.create({
        recoveryCaseId:
          recoveryCase._id,

        actionType:
          recoveryCase.recommendedAction ||
          "RETRY_PAYMENT",

        targetChannel:
          recoveryCase.recommendedAction ===
          "SEND_EMAIL"
            ? "EMAIL"
            : recoveryCase.recommendedAction ===
                "SEND_SMS_OR_WHATSAPP"
              ? "SMS"
              : "RAZORPAY",

        reason:
          "Merchant approved this recovery action after human review.",

        status:
          "SCHEDULED",

        costTier:
          "LOW",

        scheduledAt:
          new Date()
      });

    recoveryCase.status =
      "PENDING_ACTION";

    recoveryCase.currentAction =
      recoveryCase.recommendedAction;

    recoveryCase.stoppedReason =
      null;

    recoveryCase.nextActionAt =
      approvedAction.scheduledAt;

    recoveryCase.timeline.push({
      event:
        "HUMAN_APPROVAL_GRANTED",

      description:
        "Merchant approved the AI-recommended recovery action.",

      timestamp: new Date()
    });

    recoveryCase.timeline.push({
      event:
        "ACTION_SCHEDULED",

      description:
        "Merchant-approved recovery action scheduled for worker execution.",

      timestamp:
        new Date()
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
          recoveryCase.recommendedAction,

        actionId:
          approvedAction._id
      }
    });

    await createAuditLog({
      merchantId:
        recoveryCase.merchantId,

      recoveryCaseId:
        recoveryCase._id,

      actor:
        "MERCHANT",

      eventType:
        "ACTION_SCHEDULED",

      description:
        "Merchant-approved recovery action scheduled for worker execution.",

      metadata: {
        actionId:
          approvedAction._id,

        action:
          approvedAction.actionType
      }
    });

    res.status(200).json({
      success: true,

      data: {
        recoveryCase,
        action:
          approvedAction
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
