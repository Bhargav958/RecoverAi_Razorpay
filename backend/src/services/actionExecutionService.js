import RecoveryAction from "../models/RecoveryAction.js";
import RecoveryCase from "../models/RecoveryCase.js";

const executeRecoveryAction = async ({
  recoveryActionId,
  mode = "SIMULATION"
}) => {
  const action = await RecoveryAction.findById(
    recoveryActionId
  );

  if (!action) {
    throw new Error("Recovery action not found");
  }

  const recoveryCase =
    await RecoveryCase.findById(
      action.recoveryCaseId
    );

  if (!recoveryCase) {
    throw new Error(
      "Recovery case not found for recovery action"
    );
  }

  if (action.status === "SUCCEEDED") {
    return {
      success: true,
      message: "Action already succeeded",
      action,
      recoveryCase
    };
  }

  /*
  |--------------------------------------------------------------------------
  | Only scheduled/pending actions can execute
  |--------------------------------------------------------------------------
  */

  if (
    action.status !== "SCHEDULED" &&
    action.status !== "PENDING"
  ) {
    throw new Error(
      `Action cannot be executed from status ${action.status}`
    );
  }

  /*
  |--------------------------------------------------------------------------
  | Simulation Mode
  |--------------------------------------------------------------------------
  */

  if (mode === "SIMULATION") {
    action.status = "EXECUTED";
    action.executedAt = new Date();

    recoveryCase.attempts += 1;

    recoveryCase.status =
      "ACTION_EXECUTED";

    recoveryCase.timeline.push({
      event: "ACTION_EXECUTED",

      description:
        `${action.actionType} executed in simulation mode.`,

      timestamp: new Date()
    });

    await action.save();
    await recoveryCase.save();

    return {
      success: true,
      executed: true,
      mode,
      action,
      recoveryCase
    };
  }

  /*
  |--------------------------------------------------------------------------
  | Live Mode
  |--------------------------------------------------------------------------
  */

  throw new Error(
    "LIVE execution will be connected to Razorpay in the next integration step."
  );
};

export default executeRecoveryAction;