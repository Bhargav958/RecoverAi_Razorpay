// import RecoveryAction from "../models/RecoveryAction.js";
// import RecoveryCase from "../models/RecoveryCase.js";
// import Payment from "../models/Payment.js";

// const verifyRecovery = async ({
//   recoveryActionId,
//   simulateSuccess = true
// }) => {
//   const action =
//     await RecoveryAction.findById(
//       recoveryActionId
//     );

//   if (!action) {
//     throw new Error(
//       "Recovery action not found"
//     );
//   }

//   const recoveryCase =
//     await RecoveryCase.findById(
//       action.recoveryCaseId
//     );

//   if (!recoveryCase) {
//     throw new Error(
//       "Recovery case not found"
//     );
//   }

//   const payment =
//     await Payment.findById(
//       recoveryCase.paymentId
//     );

//   if (!payment) {
//     throw new Error(
//       "Payment not found"
//     );
//   }

//   if (action.status === "SUCCEEDED") {
//     return {
//       success: true,
//       recovered: true,
//       amountRecovered:
//         action.amountRecovered ||
//         recoveryCase.amountRecovered,
//       action,
//       recoveryCase,
//       payment
//     };
//   }

//   /*
//   |--------------------------------------------------------------------------
//   | Only executed actions can be verified
//   |--------------------------------------------------------------------------
//   */

//   if (
//     action.status !== "EXECUTED"
//   ) {
//     throw new Error(
//       `Action must be EXECUTED before verification. Current status: ${action.status}`
//     );
//   }

//   recoveryCase.status =
//     "VERIFYING";

//   recoveryCase.timeline.push({
//     event: "VERIFICATION_STARTED",

//     description:
//       "Recovery outcome verification started.",

//     timestamp: new Date()
//   });

//   /*
//   |--------------------------------------------------------------------------
//   | Simulation Result
//   |--------------------------------------------------------------------------
//   */

//   if (simulateSuccess) {
//     /*
//      * Payment is considered successfully recovered.
//      */

//     payment.status = "CAPTURED";
//     payment.paidAt = new Date();

//     action.status = "SUCCEEDED";
//     action.amountRecovered =
//       recoveryCase.amountAtRisk;

//     action.result =
//       "Payment successfully recovered in simulation.";

//     recoveryCase.amountRecovered =
//       recoveryCase.amountAtRisk;

//     recoveryCase.status =
//       "RECOVERED";

//     recoveryCase.stoppedReason =
//       "Payment successfully recovered.";

//     recoveryCase.timeline.push({
//       event: "PAYMENT_RECOVERED",

//       description:
//         `₹${recoveryCase.amountAtRisk.toLocaleString(
//           "en-IN"
//         )} successfully recovered.`,

//       timestamp: new Date()
//     });

//     recoveryCase.timeline.push({
//       event: "RECOVERY_WORKFLOW_STOPPED",

//       description:
//         "Workflow stopped because payment was recovered.",

//       timestamp: new Date()
//     });

//     await payment.save();
//     await action.save();
//     await recoveryCase.save();

//     return {
//       success: true,

//       recovered: true,

//       amountRecovered:
//         recoveryCase.amountRecovered,

//       action,

//       recoveryCase,

//       payment
//     };
//   }

//   /*
//   |--------------------------------------------------------------------------
//   | Simulation Failure
//   |--------------------------------------------------------------------------
//   */

//   action.status = "FAILED";

//   action.result =
//     "Recovery attempt did not recover the payment.";

//   recoveryCase.status =
//     "FAILED";

//   recoveryCase.timeline.push({
//     event: "RECOVERY_ATTEMPT_FAILED",

//     description:
//       "Payment was not recovered by the current action.",

//     timestamp: new Date()
//   });

//   await action.save();
//   await recoveryCase.save();

//   return {
//     success: true,

//     recovered: false,

//     amountRecovered: 0,

//     action,

//     recoveryCase,

//     payment
//   };
// };

// export default verifyRecovery;

import RecoveryAction from "../models/RecoveryAction.js";
import RecoveryCase from "../models/RecoveryCase.js";
import Payment from "../models/Payment.js";
import Customer from "../models/Customer.js";

/*
|--------------------------------------------------------------------------
| Verify Recovery
|--------------------------------------------------------------------------
|
| This service determines whether an executed recovery action
| actually resulted in recovered revenue.
|
| IMPORTANT:
| Executing an action does NOT mean the payment was recovered.
|
|--------------------------------------------------------------------------
*/

const verifyRecovery = async ({
  recoveryActionId,
  simulateSuccess = true
}) => {
  /*
  |--------------------------------------------------------------------------
  | Load action
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
  | Idempotency
  |--------------------------------------------------------------------------
  |
  | Don't process an already verified successful action again.
  |
  */

  if (action.status === "SUCCEEDED") {
    const existingRecoveryCase =
      await RecoveryCase.findById(
        action.recoveryCaseId
      );

    return {
      success: true,
      recovered: true,
      alreadyVerified: true,
      amountRecovered:
        action.amountRecovered || 0,
      action,
      recoveryCase:
        existingRecoveryCase
    };
  }

  /*
  |--------------------------------------------------------------------------
  | Action must have been executed
  |--------------------------------------------------------------------------
  */

  if (
    action.status !== "EXECUTED"
  ) {
    throw new Error(
      `Recovery action must be EXECUTED before verification. Current status: ${action.status}`
    );
  }

  /*
  |--------------------------------------------------------------------------
  | Load recovery case
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
  | Load payment
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
  | Load customer
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
  | Move case to VERIFYING
  |--------------------------------------------------------------------------
  */

  recoveryCase.status =
    "VERIFYING";

  recoveryCase.timeline.push({
    event: "VERIFICATION_STARTED",

    description:
      "Recovery outcome verification started.",

    timestamp: new Date()
  });

  await recoveryCase.save();

  /*
  |--------------------------------------------------------------------------
  | SIMULATION MODE
  |--------------------------------------------------------------------------
  */

  if (simulateSuccess) {
    /*
     * In simulation mode we assume the customer
     * successfully completed the recovery payment.
     */

    payment.status =
      "CAPTURED";

    payment.paidAt =
      new Date();

    action.status =
      "SUCCEEDED";

    action.executedAt =
      action.executedAt ||
      new Date();

    action.amountRecovered =
      recoveryCase.amountAtRisk;

    action.result =
      "Payment successfully recovered in simulation.";

    /*
     * Update recovery case
     */

    recoveryCase.amountRecovered =
      recoveryCase.amountAtRisk;

    recoveryCase.status =
      "RECOVERED";

    recoveryCase.stoppedReason =
      "Payment successfully recovered.";

    /*
     * Update customer statistics
     */

    customer.successfulPayments += 1;

    customer.previousRecoveries += 1;

    /*
     * Recalculate total payment count defensively.
     */

    if (
      customer.totalPayments <
      customer.successfulPayments +
        customer.failedPayments
    ) {
      customer.totalPayments =
        customer.successfulPayments +
        customer.failedPayments;
    }

    customer.lifetimeValue +=
      recoveryCase.amountAtRisk;

    /*
     * Timeline
     */

    recoveryCase.timeline.push({
      event: "PAYMENT_RECOVERED",

      description:
        `₹${recoveryCase.amountAtRisk.toLocaleString(
          "en-IN"
        )} successfully recovered.`,

      timestamp: new Date()
    });

    recoveryCase.timeline.push({
      event:
        "RECOVERY_WORKFLOW_STOPPED",

      description:
        "Workflow stopped because payment was successfully recovered.",

      timestamp: new Date()
    });

    /*
     * Save everything
     */

    await payment.save();

    await customer.save();

    await action.save();

    await recoveryCase.save();

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
  | SIMULATED FAILURE
  |--------------------------------------------------------------------------
  */

  action.status =
    "FAILED";

  action.executedAt =
    action.executedAt ||
    new Date();

  action.amountRecovered = 0;

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

    timestamp: new Date()
  });

  await action.save();

  await recoveryCase.save();

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