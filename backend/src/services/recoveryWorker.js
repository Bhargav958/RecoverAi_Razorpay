import RecoveryAction from "../models/RecoveryAction.js";
import RecoveryCase from "../models/RecoveryCase.js";

import executeRecoveryAction from "./actionExecutionService.js";
import verifyRecovery from "./verificationService.js";

import {
  createAuditLog
} from "./auditService.js";

/*
|--------------------------------------------------------------------------
| Recovery Worker
|--------------------------------------------------------------------------
|
| Finds scheduled recovery actions and processes them.
|
| Normal mode:
|   - Processes scheduled actions that are due.
|
| Demo mode:
|   - ignoreSchedule=true allows scheduled actions to execute immediately.
|
| Targeted mode:
|   - recoveryCaseId allows the demo/UI to execute ONE specific case.
|
|--------------------------------------------------------------------------
*/

/*
|--------------------------------------------------------------------------
| Get due actions
|--------------------------------------------------------------------------
*/

const getDueActions = async ({
  merchantId = null,
  recoveryCaseId = null,
  ignoreSchedule = false,
  limit = 20
} = {}) => {

  /*
  |--------------------------------------------------------------------------
  | Base query
  |--------------------------------------------------------------------------
  */

  const query = {
    status: "SCHEDULED"
  };

  /*
  |--------------------------------------------------------------------------
  | Specific recovery case
  |--------------------------------------------------------------------------
  |
  | This takes priority over broad merchant filtering.
  |
  |--------------------------------------------------------------------------
  */

  if (recoveryCaseId) {
    query.recoveryCaseId =
      recoveryCaseId;
  }

  /*
  |--------------------------------------------------------------------------
  | Merchant filtering
  |--------------------------------------------------------------------------
  */

  if (
    merchantId &&
    !recoveryCaseId
  ) {
    const cases =
      await RecoveryCase.find({
        merchantId
      }).select("_id");

    const caseIds =
      cases.map(
        (item) => item._id
      );

    query.recoveryCaseId = {
      $in: caseIds
    };
  }

  /*
  |--------------------------------------------------------------------------
  | Schedule filtering
  |--------------------------------------------------------------------------
  */

  if (!ignoreSchedule) {
    query.scheduledAt = {
      $lte: new Date()
    };
  }

  return RecoveryAction.find(
    query
  )
    .sort({
      scheduledAt: 1
    })
    .limit(limit);
};

/*
|--------------------------------------------------------------------------
| Process one scheduled action
|--------------------------------------------------------------------------
*/

const processScheduledAction = async ({
  action,
  mode = "SIMULATION"
}) => {

  /*
  |--------------------------------------------------------------------------
  | Execute
  |--------------------------------------------------------------------------
  */

  const execution =
    await executeRecoveryAction({
      recoveryActionId:
        action._id,

      mode
    });

  /*
  |--------------------------------------------------------------------------
  | Audit — Action Executed
  |--------------------------------------------------------------------------
  */

  if (execution.executed) {
    const recoveryCase =
      execution.recoveryCase;

    await createAuditLog({
      merchantId:
        recoveryCase.merchantId,

      recoveryCaseId:
        recoveryCase._id,

      actor:
        mode === "SIMULATION"
          ? "SIMULATION"
          : "SYSTEM",

      eventType:
        "ACTION_EXECUTED",

      description:
        `${action.actionType} executed by recovery worker.`,

      metadata: {
        actionId:
          action._id,

        actionType:
          action.actionType,

        executionMode:
          mode
      }
    });
  }

  /*
  |--------------------------------------------------------------------------
  | Verify
  |--------------------------------------------------------------------------
  */

  const verification =
    await verifyRecovery({
      recoveryActionId:
        action._id,

      simulateSuccess:
        mode === "SIMULATION"
    });

  return {
    execution,
    verification
  };
};

/*
|--------------------------------------------------------------------------
| Process actions
|--------------------------------------------------------------------------
*/

const processDueActions = async ({
  merchantId = null,
  recoveryCaseId = null,
  ignoreSchedule = false,
  mode = "SIMULATION",
  limit = 20
} = {}) => {

  const actions =
    await getDueActions({
      merchantId,

      recoveryCaseId,

      ignoreSchedule,

      limit
    });

  const results = [];

  for (
    const action of actions
  ) {
    try {

      const result =
        await processScheduledAction({
          action,
          mode
        });

      results.push({
        actionId:
          action._id,

        recoveryCaseId:
          action.recoveryCaseId,

        success: true,

        result
      });

    } catch (error) {

      console.error(
        `Worker failed for action ${action._id}:`,
        error.message
      );

      results.push({
        actionId:
          action._id,

        recoveryCaseId:
          action.recoveryCaseId,

        success: false,

        error:
          error.message
      });
    }
  }

  /*
  |--------------------------------------------------------------------------
  | Summary
  |--------------------------------------------------------------------------
  */

  const recovered =
    results.filter(
      (item) =>
        item.success &&
        item.result?.verification
          ?.recovered
    );

  const failed =
    results.filter(
      (item) =>
        !item.success
    );

  const recoveredAmount =
    recovered.reduce(
      (total, item) =>
        total +
        Number(
          item.result?.verification
            ?.amountRecovered || 0
        ),
      0
    );

  return {
    processed:
      results.length,

    executed:
      results.filter(
        (item) =>
          item.success &&
          item.result?.execution
            ?.executed
      ).length,

    recovered:
      recovered.length,

    recoveredAmount,

    failed:
      failed.length,

    results
  };
};

export {
  getDueActions,
  processScheduledAction,
  processDueActions
};

export default processDueActions;