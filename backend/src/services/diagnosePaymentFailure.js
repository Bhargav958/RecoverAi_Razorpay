import {
  diagnosePaymentFailure as runAIDiagnosis
} from "./aiDiagnosisService.js";

/**
 * Public diagnosis function used by the recovery workflow.
 *
 * This wrapper gives us a clean boundary so that the rest
 * of RecoverAI doesn't need to know which AI provider is used.
 */
const diagnosePaymentFailure = async ({
  payment,
  customer,
  risk
}) => {
  if (!payment) {
    throw new Error(
      "Payment data is required for diagnosis"
    );
  }

  if (!customer) {
    throw new Error(
      "Customer data is required for diagnosis"
    );
  }

  if (!risk) {
    throw new Error(
      "Risk analysis is required before AI diagnosis"
    );
  }

  return runAIDiagnosis({
    payment,
    customer,
    risk
  });
};

export default diagnosePaymentFailure;