const clamp = (value, min, max) => {
  return Math.min(Math.max(value, min), max);
};

/**
 * Calculate how likely the current payment is to become
 * permanently lost revenue.
 */
const calculateRiskScore = ({ payment, customer }) => {
  let score = 50;

  // Larger payments represent greater revenue exposure.
  if (payment.amount >= 25000) {
    score += 20;
  } else if (payment.amount >= 10000) {
    score += 12;
  } else if (payment.amount >= 5000) {
    score += 7;
  }

  // Failure history.
  if (customer.failedPayments >= 5) {
    score += 15;
  } else if (customer.failedPayments >= 3) {
    score += 10;
  }

  // A customer with a strong success history is generally
  // easier to recover.
  if (customer.successfulPayments >= 10) {
    score -= 8;
  } else if (customer.successfulPayments >= 5) {
    score -= 4;
  }

  // Failure-specific signals.
  switch (payment.failureCode) {
    case "BANK_TEMPORARY_FAILURE":
      score += 5;
      break;

    case "CARD_EXPIRED":
      score += 10;
      break;

    case "INSUFFICIENT_FUNDS":
      score += 8;
      break;

    case "AUTHENTICATION_FAILED":
      score += 6;
      break;

    case "GATEWAY_TIMEOUT":
      score += 5;
      break;

    default:
      score += 3;
  }

  return clamp(Math.round(score), 0, 100);
};

/**
 * Estimate probability that this revenue can be recovered.
 */
const calculateRecoveryProbability = ({
  payment,
  customer,
  riskScore
}) => {
  let probability = 50;

  // Strong payment history is a major positive signal.
  if (customer.successfulPayments >= 10) {
    probability += 22;
  } else if (customer.successfulPayments >= 5) {
    probability += 12;
  } else if (customer.successfulPayments >= 2) {
    probability += 5;
  }

  // Repeated failures reduce probability.
  if (customer.failedPayments >= 5) {
    probability -= 20;
  } else if (customer.failedPayments >= 3) {
    probability -= 12;
  }

  // Customer value can provide a useful prioritization signal.
  if (customer.lifetimeValue >= 100000) {
    probability += 8;
  } else if (customer.lifetimeValue >= 50000) {
    probability += 5;
  }

  // Failure-specific probability.
  switch (payment.failureCode) {
    case "BANK_TEMPORARY_FAILURE":
      probability += 10;
      break;

    case "CARD_EXPIRED":
      probability += 4;
      break;

    case "INSUFFICIENT_FUNDS":
      probability -= 8;
      break;

    case "AUTHENTICATION_FAILED":
      probability -= 4;
      break;

    case "GATEWAY_TIMEOUT":
      probability += 8;
      break;

    default:
      probability -= 2;
  }

  // Slight adjustment based on overall risk.
  if (riskScore >= 80) {
    probability -= 3;
  }

  return clamp(Math.round(probability), 0, 100);
};

/**
 * Expected recovery = amount at risk × recovery probability.
 */
const calculateExpectedRecovery = (
  amount,
  recoveryProbability
) => {
  return Math.round(
    amount * (recoveryProbability / 100)
  );
};

/**
 * Higher-value and more recoverable cases should appear
 * earlier in the recovery command center.
 */
const calculatePriorityScore = ({
  amount,
  recoveryProbability,
  customer,
  riskScore
}) => {
  let customerValueFactor = 1;

  if (customer.lifetimeValue >= 100000) {
    customerValueFactor = 1.5;
  } else if (customer.lifetimeValue >= 50000) {
    customerValueFactor = 1.25;
  }

  const urgencyFactor = riskScore >= 80 ? 1.2 : 1;

  const priority =
    amount *
    (recoveryProbability / 100) *
    customerValueFactor *
    urgencyFactor;

  return Math.round(priority);
};

/**
 * Main public function.
 *
 * This is the only function other services need to call.
 */
const calculateRisk = ({
  payment,
  customer
}) => {
  if (!payment || !customer) {
    throw new Error(
      "Payment and customer data are required"
    );
  }

  const riskScore =
    calculateRiskScore({
      payment,
      customer
    });

  const recoveryProbability =
    calculateRecoveryProbability({
      payment,
      customer,
      riskScore
    });

  const expectedRecovery =
    calculateExpectedRecovery(
      payment.amount,
      recoveryProbability
    );

  const priorityScore =
    calculatePriorityScore({
      amount: payment.amount,
      recoveryProbability,
      customer,
      riskScore
    });

  return {
    riskScore,
    recoveryProbability,
    expectedRecovery,
    priorityScore
  };
};

export {
  calculateRisk,
  calculateRiskScore,
  calculateRecoveryProbability,
  calculateExpectedRecovery,
  calculatePriorityScore
};