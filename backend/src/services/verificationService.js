import RecoveryAction from "../models/RecoveryAction.js";
import RecoveryCase from "../models/RecoveryCase.js";
import Payment from "../models/Payment.js";

const verifyRecovery = async ({
  recoveryActionId,
  simulateSuccess = true
}) => {
  const action =
    await RecoveryAction.findById(
      recoveryActionId
    );

  if (!action) {
    throw new Error(
      "Recovery action not found"
    );
  }

  const recoveryCase =
    await RecoveryCase.findById(
      action.recoveryCaseId
    );

  if (!recoveryCase) {
    throw new Error(
      "Recovery case not found"
    );
  }

  const payment =
    await Payment.findById(
      recoveryCase.paymentId
    );

  if (!payment) {
    throw new Error(
      "Payment not found"
    );
  }

  /*
  |--------------------------------------------------------------------------
  | Only executed actions can be verified
  |--------------------------------------------------------------------------
  */

  if (
    action.status !== "EXECUTED"
  ) {
    throw new Error(
      `Action must be EXECUTED before verification. Current status: ${action.status}`
    );
  }

  recoveryCase.status =
    "VERIFYING";

  recoveryCase.timeline.push({
    event: "VERIFICATION_STARTED",

    description:
      "Recovery outcome verification started.",

    timestamp: new Date()
  });

  /*
  |--------------------------------------------------------------------------
  | Simulation Result
  |--------------------------------------------------------------------------
  */

  if (simulateSuccess) {
    /*
     * Payment is considered successfully recovered.
     */

    payment.status = "CAPTURED";
    payment.paidAt = new Date();

    action.status = "SUCCEEDED";
    action.amountRecovered =
      recoveryCase.amountAtRisk;

    action.result =
      "Payment successfully recovered in simulation.";

    recoveryCase.amountRecovered =
      recoveryCase.amountAtRisk;

    recoveryCase.status =
      "RECOVERED";

    recoveryCase.stoppedReason =
      "Payment successfully recovered.";

    recoveryCase.timeline.push({
      event: "PAYMENT_RECOVERED",

      description:
        `₹${recoveryCase.amountAtRisk.toLocaleString(
          "en-IN"
        )} successfully recovered.`,

      timestamp: new Date()
    });

    recoveryCase.timeline.push({
      event: "RECOVERY_WORKFLOW_STOPPED",

      description:
        "Workflow stopped because payment was recovered.",

      timestamp: new Date()
    });

    await payment.save();
    await action.save();
    await recoveryCase.save();

    return {
      success: true,

      recovered: true,

      amountRecovered:
        recoveryCase.amountRecovered,

      action,

      recoveryCase,

      payment
    };
  }

  /*
  |--------------------------------------------------------------------------
  | Simulation Failure
  |--------------------------------------------------------------------------
  */

  action.status = "FAILED";

  action.result =
    "Recovery attempt did not recover the payment.";

  recoveryCase.status =
    "FAILED";

  recoveryCase.timeline.push({
    event: "RECOVERY_ATTEMPT_FAILED",

    description:
      "Payment was not recovered by the current action.",

    timestamp: new Date()
  });

  await action.save();
  await recoveryCase.save();

  return {
    success: true,

    recovered: false,

    amountRecovered: 0,

    action,

    recoveryCase,

    payment
  };
};

export default verifyRecovery;