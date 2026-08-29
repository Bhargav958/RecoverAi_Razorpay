import RecoveryAction from "../models/RecoveryAction.js";
import RecoveryCase from "../models/RecoveryCase.js";
import Payment from "../models/Payment.js";
import Customer from "../models/Customer.js";

import {
  createAuditLog
} from "./auditService.js";

/*
|--------------------------------------------------------------------------
| Verification Service
|--------------------------------------------------------------------------
|
| Responsibilities:
|
| 1. Verify an EXECUTED recovery action.
| 2. Convert successful execution into verified recovery.
| 3. Synchronize already-SUCCEEDED actions with their RecoveryCase.
| 4. Prevent duplicate recovery counting.
|
|--------------------------------------------------------------------------
*/

const verifyRecovery = async ({
  recoveryActionId,
  simulateSuccess = true
}) => {
  /*
  |--------------------------------------------------------------------------
  | Load Recovery Action
  |--------------------------------------------------------------------------
  */

  const action =
    await RecoveryAction.findById(
      recoveryActionId
    );

  if (!action) {
    throw new Error(
      "Recovery action not found"
    );
  }

  /*
  |--------------------------------------------------------------------------
  | Load Recovery Case
  |--------------------------------------------------------------------------
  */

  const recoveryCase =
    await RecoveryCase.findById(
      action.recoveryCaseId
    );

  if (!recoveryCase) {
    throw new Error(
      "Recovery case not found"
    );
  }

  /*
  |--------------------------------------------------------------------------
  | Load Payment
  |--------------------------------------------------------------------------
  */

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
  | Load Customer
  |--------------------------------------------------------------------------
  */

  const customer =
    await Customer.findById(
      recoveryCase.customerId
    );

  if (!customer) {
    throw new Error(
      "Customer not found"
    );
  }

  /*
  |--------------------------------------------------------------------------
  | IMPORTANT IDEMPOTENCY / RECONCILIATION
  |--------------------------------------------------------------------------
  |
  | The RecoveryAction may already be SUCCEEDED because the execution
  | service/worker marked it successful before verification was called.
  |
  | In that situation, we must NOT simply return.
  |
  | We reconcile the RecoveryCase and Payment with that successful action.
  |
  |--------------------------------------------------------------------------
  */

  if (
    action.status === "SUCCEEDED"
  ) {
    /*
     * If the case is already recovered, do absolutely nothing.
     * This prevents duplicate revenue/customer counting.
     */

    if (
      recoveryCase.status ===
      "RECOVERED"
    ) {
      return {
        success: true,

        recovered: true,

        alreadyVerified: true,

        amountRecovered:
          recoveryCase.amountRecovered ||
          action.amountRecovered ||
          0,

        action,

        recoveryCase,

        payment,

        customer
      };
    }

    /*
     * The action says success, but the case has not yet
     * been synchronized.
     *
     * Reconcile it now.
     */

    recoveryCase.status =
      "VERIFYING";

    recoveryCase.timeline.push({
      event:
        "VERIFICATION_STARTED",

      description:
        "Recovery verification reconciled a previously successful action.",

      timestamp:
        new Date()
    });

    /*
     * Use the action's recovered amount when available,
     * otherwise cap recovery at amountAtRisk.
     */

    const recoveredAmount =
      Math.min(
        action.amountRecovered ||
          recoveryCase.amountAtRisk ||
          0,

        recoveryCase.amountAtRisk || 0
      );

    /*
     * Mark payment captured.
     */

    payment.status =
      "CAPTURED";

    payment.paidAt =
      payment.paidAt ||
      new Date();

    /*
     * Synchronize action.
     */

    action.amountRecovered =
      recoveredAmount;

    action.result =
      action.result ||
      "Payment successfully recovered.";

    /*
     * Synchronize case.
     */

    recoveryCase.amountRecovered =
      recoveredAmount;

    recoveryCase.status =
      "RECOVERED";

    recoveryCase.nextActionAt =
      null;

    recoveryCase.currentAction =
      null;

    recoveryCase.stoppedReason =
      "Payment successfully recovered.";

    /*
     * Only update customer statistics if this case
     * was not previously counted as recovered.
     */

    customer.successfulPayments =
      Number(
        customer.successfulPayments || 0
      ) + 1;

    customer.previousRecoveries =
      Number(
        customer.previousRecoveries || 0
      ) + 1;

    /*
     * Keep totalPayments logically consistent.
     */

    const minimumTotalPayments =
      Number(
        customer.successfulPayments || 0
      ) +
      Number(
        customer.failedPayments || 0
      );

    if (
      Number(
        customer.totalPayments || 0
      ) < minimumTotalPayments
    ) {
      customer.totalPayments =
        minimumTotalPayments;
    }

    customer.lifetimeValue =
      Number(
        customer.lifetimeValue || 0
      ) + recoveredAmount;

    /*
     * Recovery timeline.
     */

    recoveryCase.timeline.push({
      event:
        "PAYMENT_RECOVERED",

      description:
        `₹${recoveredAmount.toLocaleString(
          "en-IN"
        )} successfully recovered.`,

      timestamp:
        new Date()
    });

    recoveryCase.timeline.push({
      event:
        "RECOVERY_WORKFLOW_STOPPED",

      description:
        "Recovery workflow stopped because payment was successfully recovered.",

      timestamp:
        new Date()
    });

    /*
     * Save all synchronized state.
     */

    await payment.save();

    await customer.save();

    await action.save();

    await recoveryCase.save();

    /*
     |--------------------------------------------------------------------------
     | Audit — Payment Recovered
     |--------------------------------------------------------------------------
     */

    await createAuditLog({
      merchantId:
        recoveryCase.merchantId,

      recoveryCaseId:
        recoveryCase._id,

      actor:
        "SYSTEM",

      eventType:
        "PAYMENT_RECOVERED",

      description:
        `₹${recoveredAmount.toLocaleString(
          "en-IN"
        )} successfully recovered.`,

      metadata: {
        actionId:
          action._id,

        paymentId:
          payment._id,

        amountRecovered:
          recoveredAmount,

        reconciledExistingSuccess:
          true
      }
    });

    /*
     |--------------------------------------------------------------------------
     | Audit — Workflow Stopped
     |--------------------------------------------------------------------------
     */

    await createAuditLog({
      merchantId:
        recoveryCase.merchantId,

      recoveryCaseId:
        recoveryCase._id,

      actor:
        "SYSTEM",

      eventType:
        "RECOVERY_WORKFLOW_STOPPED",

      description:
        "Recovery workflow stopped because payment was successfully recovered.",

      metadata: {
        stopReason:
          recoveryCase.stoppedReason,

        amountRecovered:
          recoveredAmount
      }
    });

    return {
      success: true,

      recovered: true,

      alreadyVerified: false,

      reconciledExistingSuccess:
        true,

      amountRecovered:
        recoveredAmount,

      action,

      recoveryCase,

      payment,

      customer
    };
  }

  /*
  |--------------------------------------------------------------------------
  | Only EXECUTED actions can normally enter verification.
  |--------------------------------------------------------------------------
  */

  if (
    action.status !==
    "EXECUTED"
  ) {
    throw new Error(
      `Recovery action must be EXECUTED before verification. Current status: ${action.status}`
    );
  }

  /*
  |--------------------------------------------------------------------------
  | Move case to VERIFYING
  |--------------------------------------------------------------------------
  */

  recoveryCase.status =
    "VERIFYING";

  recoveryCase.timeline.push({
    event:
      "VERIFICATION_STARTED",

    description:
      "Recovery outcome verification started.",

    timestamp:
      new Date()
  });

  await recoveryCase.save();

  /*
  |--------------------------------------------------------------------------
  | SIMULATION MODE — SUCCESS
  |--------------------------------------------------------------------------
  */

  if (simulateSuccess) {
    /*
     * Payment is considered successfully recovered.
     */

    payment.status =
      "CAPTURED";

    payment.paidAt =
      new Date();

    /*
     * Mark action successful.
     */

    action.status =
      "SUCCEEDED";

    action.executedAt =
      action.executedAt ||
      new Date();

    const recoveredAmount =
      Math.min(
        recoveryCase.amountAtRisk || 0,
        recoveryCase.amountAtRisk || 0
      );

    action.amountRecovered =
      recoveredAmount;

    action.result =
      "Payment successfully recovered in simulation.";

    /*
     * Update Recovery Case.
     */

    recoveryCase.amountRecovered =
      recoveredAmount;

    recoveryCase.status =
      "RECOVERED";

    recoveryCase.nextActionAt =
      null;

    recoveryCase.currentAction =
      null;

    recoveryCase.stoppedReason =
      "Payment successfully recovered.";

    /*
     * Update Customer statistics.
     */

    customer.successfulPayments =
      Number(
        customer.successfulPayments || 0
      ) + 1;

    customer.previousRecoveries =
      Number(
        customer.previousRecoveries || 0
      ) + 1;

    /*
     * Keep totalPayments logically consistent.
     */

    const minimumTotalPayments =
      Number(
        customer.successfulPayments || 0
      ) +
      Number(
        customer.failedPayments || 0
      );

    if (
      Number(
        customer.totalPayments || 0
      ) < minimumTotalPayments
    ) {
      customer.totalPayments =
        minimumTotalPayments;
    }

    customer.lifetimeValue =
      Number(
        customer.lifetimeValue || 0
      ) + recoveredAmount;

    /*
     * Recovery Case Timeline
     */

    recoveryCase.timeline.push({
      event:
        "PAYMENT_RECOVERED",

      description:
        `₹${recoveredAmount.toLocaleString(
          "en-IN"
        )} successfully recovered.`,

      timestamp:
        new Date()
    });

    recoveryCase.timeline.push({
      event:
        "RECOVERY_WORKFLOW_STOPPED",

      description:
        "Recovery workflow stopped because payment was successfully recovered.",

      timestamp:
        new Date()
    });

    /*
     * Save database changes.
     */

    await payment.save();

    await customer.save();

    await action.save();

    await recoveryCase.save();

    /*
     |--------------------------------------------------------------------------
     | Audit — Payment Recovered
     |--------------------------------------------------------------------------
     */

    await createAuditLog({
      merchantId:
        recoveryCase.merchantId,

      recoveryCaseId:
        recoveryCase._id,

      actor:
        "SYSTEM",

      eventType:
        "PAYMENT_RECOVERED",

      description:
        `₹${recoveredAmount.toLocaleString(
          "en-IN"
        )} successfully recovered.`,

      metadata: {
        actionId:
          action._id,

        paymentId:
          payment._id,

        amountRecovered:
          recoveredAmount
      }
    });

    /*
     |--------------------------------------------------------------------------
     | Audit — Workflow Stopped
     |--------------------------------------------------------------------------
     */

    await createAuditLog({
      merchantId:
        recoveryCase.merchantId,

      recoveryCaseId:
        recoveryCase._id,

      actor:
        "SYSTEM",

      eventType:
        "RECOVERY_WORKFLOW_STOPPED",

      description:
        "Recovery workflow stopped because payment was successfully recovered.",

      metadata: {
        stopReason:
          recoveryCase.stoppedReason,

        amountRecovered:
          recoveryCase.amountRecovered
      }
    });

    return {
      success: true,

      recovered: true,

      alreadyVerified: false,

      amountRecovered:
        recoveryCase.amountRecovered,

      action,

      recoveryCase,

      payment,

      customer
    };
  }

  /*
  |--------------------------------------------------------------------------
  | SIMULATION MODE — FAILURE
  |--------------------------------------------------------------------------
  */

  action.status =
    "FAILED";

  action.executedAt =
    action.executedAt ||
    new Date();

  action.amountRecovered =
    0;

  action.result =
    "Recovery action executed, but the customer did not complete payment.";

  recoveryCase.status =
    "FAILED";

  recoveryCase.amountRecovered =
    0;

  recoveryCase.timeline.push({
    event:
      "RECOVERY_ATTEMPT_FAILED",

    description:
      "Recovery action completed but payment was not recovered.",

    timestamp:
      new Date()
  });

  await action.save();

  await recoveryCase.save();

  /*
   * Audit: Recovery Failed
   */

  await createAuditLog({
    merchantId:
      recoveryCase.merchantId,

    recoveryCaseId:
      recoveryCase._id,

    actor:
      "SYSTEM",

    eventType:
      "RECOVERY_ATTEMPT_FAILED",

    description:
      "Recovery action executed but payment was not recovered.",

    metadata: {
      actionId:
        action._id,

      paymentId:
        payment._id,

      amountRecovered:
        0
    }
  });

  return {
    success: true,

    recovered: false,

    alreadyVerified: false,

    amountRecovered: 0,

    action,

    recoveryCase,

    payment,

    customer
  };
};

export default verifyRecovery;