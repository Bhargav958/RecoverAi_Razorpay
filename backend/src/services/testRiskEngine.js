import { calculateRisk } from "./riskEngine.js";

const amitPayment = {
  amount: 4999,
  failureCode: "BANK_TEMPORARY_FAILURE"
};

const amitCustomer = {
  lifetimeValue: 74985,
  successfulPayments: 12,
  failedPayments: 1
};

const result = calculateRisk({
  payment: amitPayment,
  customer: amitCustomer
});

console.log("\n===== RECOVERAI RISK ENGINE TEST =====\n");

console.log("Customer: Amit Singh");
console.log(`Amount: ₹${amitPayment.amount}`);

console.log(
  `Risk Score: ${result.riskScore}/100`
);

console.log(
  `Recovery Probability: ${result.recoveryProbability}%`
);

console.log(
  `Expected Recovery: ₹${result.expectedRecovery}`
);

console.log(
  `Priority Score: ${result.priorityScore}`
);

console.log("\n=======================================\n");