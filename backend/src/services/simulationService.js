import RecoveryCase from "../models/RecoveryCase.js";
import RecoveryAction from "../models/RecoveryAction.js";

import processRecoveryCase from "./recoveryOrchestrator.js";
import executeRecoveryAction from "./actionExecutionService.js";
import verifyRecovery from "./verificationService.js";

import {
  createAuditLog
} from "./auditService.js";

/*
|--------------------------------------------------------------------------
| Simulation Service
|--------------------------------------------------------------------------
|
| IMPORTANT:
|
| A simulation batch must only operate on the cases selected
| for that specific batch.
|
| It must NEVER execute unrelated scheduled actions belonging
| to the same merchant.
|
|--------------------------------------------------------------------------
*/

const runSimulation = async ({
  merchantId,
  batchSize = 10,
  mode = "SIMULATION"
}) => {
  if (!merchantId) {
    throw new Error(
      "merchantId is required for simulation"
    );
  }

  const safeBatchSize = Math.min(
    Math.max(
      Number(batchSize) || 10,
      1
    ),
    50
  );

  /*
  |--------------------------------------------------------------------------
  | STEP 1 — Select fresh DETECTED cases
  |--------------------------------------------------------------------------
  */

  const selectedCases =
    await RecoveryCase.find({
      merchantId,
      status: "DETECTED"
    })
      .sort({
        priorityScore: -1,
        createdAt: 1
      })
      .limit(safeBatchSize)
      .select("_id");

  if (selectedCases.length === 0) {
    return {
      success: true,
      message:
        "No DETECTED recovery cases are available.",
      selected: 0,
      processed: 0,
      failed: 0,
      scheduled: 0,
      immediate: 0,
      recovered: 0,
      recoveredAmount: 0,
      failedCases: 0,
      pending: 0,
      cases: []
    };
  }

  const selectedCaseIds =
    selectedCases.map(
      (item) => item._id
    );

  /*
  |--------------------------------------------------------------------------
  | STEP 2 — Run orchestrator ONLY for selected cases
  |--------------------------------------------------------------------------
  */

  const orchestrationResults = [];

  for (
    const selectedCase of selectedCases
  ) {
    try {
      const result =
        await processRecoveryCase({
          recoveryCaseId:
            selectedCase._id,

          mode
        });

      orchestrationResults.push({
        caseId:
          selectedCase._id,

        success: true,

        result
      });
    } catch (error) {
      orchestrationResults.push({
        caseId:
          selectedCase._id,

        success: false,

        error:
          error.message
      });
    }
  }

  /*
  |--------------------------------------------------------------------------
  | STEP 3 — Collect ONLY actions belonging to this batch
  |--------------------------------------------------------------------------
  */

  const batchActions =
    await RecoveryAction.find({
      recoveryCaseId: {
        $in: selectedCaseIds
      }
    }).sort({
      createdAt: 1
    });

  /*
  |--------------------------------------------------------------------------
  | STEP 4 — Execute ONLY this batch's scheduled actions
  |--------------------------------------------------------------------------
  */

  const executionResults = [];

  for (const action of batchActions) {
    /*
     * Only execute actions created/used by this batch.
     *
     * Scheduled actions are deliberately executed immediately
     * in simulation mode.
     */

    if (
      action.status === "SCHEDULED"
    ) {
      try {
        const execution =
          await executeRecoveryAction({
            recoveryActionId:
              action._id,

            mode
          });

        executionResults.push({
          actionId:
            action._id,

          success: true,

          execution
        });

        /*
         * Audit the execution.
         */

        const recoveryCase =
          await RecoveryCase.findById(
            action.recoveryCaseId
          );

        if (recoveryCase) {
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
              `${action.actionType} executed by simulation.`,

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

      } catch (error) {
        executionResults.push({
          actionId:
            action._id,

          success: false,

          error:
            error.message
        });
      }
    }
  }

  /*
  |--------------------------------------------------------------------------
  | STEP 5 — Find ONLY executed actions from this batch
  |--------------------------------------------------------------------------
  */

  const executedActions =
    await RecoveryAction.find({
      recoveryCaseId: {
        $in: selectedCaseIds
      },

      status: "EXECUTED"
    }).sort({
      createdAt: 1
    });

  /*
  |--------------------------------------------------------------------------
  | STEP 6 — Verify ONLY this batch's actions
  |--------------------------------------------------------------------------
  */

  const verificationResults = [];

  for (
    const action of executedActions
  ) {
    try {
      const verification =
        await verifyRecovery({
          recoveryActionId:
            action._id,

          simulateSuccess:
            mode === "SIMULATION"
        });

      verificationResults.push({
        actionId:
          action._id,

        success: true,

        verification
      });
    } catch (error) {
      verificationResults.push({
        actionId:
          action._id,

        success: false,

        recovered: false,

        error:
          error.message
      });
    }
  }

  /*
  |--------------------------------------------------------------------------
  | STEP 7 — Read ONLY the selected cases
  |--------------------------------------------------------------------------
  */

  const finalCases =
    await RecoveryCase.find({
      _id: {
        $in: selectedCaseIds
      }
    })
      .select(
        "_id amountAtRisk expectedRecovery amountRecovered status riskScore recoveryProbability rootCause recommendedAction priorityScore"
      )
      .sort({
        priorityScore: -1
      });

  /*
  |--------------------------------------------------------------------------
  | STEP 8 — Calculate batch summary
  |--------------------------------------------------------------------------
  */

  const recoveredCases =
    finalCases.filter(
      (item) =>
        item.status === "RECOVERED"
    );

  const failedCases =
    finalCases.filter(
      (item) =>
        item.status === "FAILED" ||
        item.status === "STOPPED"
    );

  const pendingCases =
    finalCases.filter(
      (item) =>
        ![
          "RECOVERED",
          "FAILED",
          "STOPPED"
        ].includes(item.status)
    );

  /*
   * Each selected case can contribute its amount at risk
   * at most once to the simulation recovery total.
   */

  const recoveredAmount =
    recoveredCases.reduce(
      (sum, item) =>
        sum +
        Math.min(
          item.amountRecovered || 0,
          item.amountAtRisk
        ),
      0
    );

  const scheduled =
    batchActions.filter(
      (action) =>
        action.status ===
        "SUCCEEDED" ||
        action.status ===
        "EXECUTED"
    ).length;

  const immediate =
    batchActions.filter(
      (action) =>
        action.status ===
        "EXECUTED"
    ).length;

  return {
    success: true,

    selected:
      selectedCases.length,

    processed:
      orchestrationResults.filter(
        (item) =>
          item.success
      ).length,

    failed:
      orchestrationResults.filter(
        (item) =>
          !item.success
      ).length,

    scheduled:

      batchActions.filter(
        (action) =>
          action.createdAt
      ).length,

    immediate,

    recovered:
      recoveredCases.length,

    recoveredAmount,

    failedCases:
      failedCases.length,

    pending:
      pendingCases.length,

    cases:
      finalCases,

    orchestrationResults,

    executionResults,

    verificationResults
  };
};

export default runSimulation;