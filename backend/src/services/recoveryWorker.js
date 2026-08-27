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
| Finds scheduled recovery actions whose execution time has arrived.
|
| Flow:
|
| SCHEDULED
|    ↓
| EXECUTE
|    ↓
| VERIFY
|    ↓
| RECOVERED / FAILED
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
  ignoreSchedule = false,
  limit = 20
} = {}) => {
  const query = {
    status: "SCHEDULED"
  };

  /*
   * Optional merchant filtering.
   */

  if (merchantId) {
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
   * In normal/production-like mode, only actions whose
   * scheduledAt has arrived are due.
   *
   * In demo mode, ignoreSchedule=true allows us to execute
   * a scheduled action immediately without changing its
   * original schedule.
   */

  if (!ignoreSchedule) {
    query.scheduledAt = {
      $lte: new Date()
    };
  }

  return RecoveryAction.find(query)
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
  |
  | In simulation mode we deliberately simulate a successful
  | payment so that we can demonstrate the full workflow.
  |
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
| Process all due actions
|--------------------------------------------------------------------------
*/

const processDueActions = async ({
  merchantId = null,
  ignoreSchedule = false,
  mode = "SIMULATION",
  limit = 20
} = {}) => {
  const actions =
    await getDueActions({
      merchantId,
      ignoreSchedule,
      limit
    });

  const results = [];

  for (const action of actions) {
    try {
      const result =
        await processScheduledAction({
          action,
          mode
        });

      results.push({
        actionId:
          action._id,

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

        success: false,

        error:
          error.message
      });
    }
  }

  return {
    processed:
      results.length,

    results
  };
};

export {
  getDueActions,
  processScheduledAction,
  processDueActions
};

export default processDueActions;