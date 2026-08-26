import dotenv from "dotenv";
import mongoose from "mongoose";

import connectDB from "../config/db.js";

import Merchant from "../models/Merchant.js";
import Customer from "../models/Customer.js";
import Payment from "../models/Payment.js";
import RecoveryCase from "../models/RecoveryCase.js";
import Policy from "../models/Policy.js";

dotenv.config();

/*
|--------------------------------------------------------------------------
| Configuration
|--------------------------------------------------------------------------
*/

const TOTAL_CUSTOMERS = 12482;
const TOTAL_FAILED_PAYMENTS = 250;

/*
|--------------------------------------------------------------------------
| Helper data
|--------------------------------------------------------------------------
*/

const firstNames = [
  "Amit",
  "Gonenedra",
  "Bhargav",
  "Raghubar",
  "Tejesh",
  "Mohan",
  "Punith",
  "Praneetha",
  "Avidha",
  "Sneha",
  "Karan",
  "Meera"
];

const lastNames = [
  "Singh",
  "Verma",
  "Mehta",
  "Mohammed",
  "Rao",
  "Reddy",
  "Kumar",
  "Reddy",
  "Shaik",
  "Joshi",
  "Singh",
  "Malhotra"
];

const failureTypes = [
  {
    code: "BANK_TEMPORARY_FAILURE",
    reason: "Temporary bank-side payment failure",
    rootCause: "TEMPORARY_BANK_FAILURE"
  },
  {
    code: "CARD_EXPIRED",
    reason: "Payment method has expired",
    rootCause: "EXPIRED_PAYMENT_METHOD"
  },
  {
    code: "INSUFFICIENT_FUNDS",
    reason: "Insufficient funds",
    rootCause: "INSUFFICIENT_FUNDS"
  },
  {
    code: "AUTHENTICATION_FAILED",
    reason: "Payment authentication failed",
    rootCause: "AUTHENTICATION_FAILURE"
  },
  {
    code: "GATEWAY_TIMEOUT",
    reason: "Payment gateway timeout",
    rootCause: "GATEWAY_TIMEOUT"
  }
];

const paymentMethods = [
  "card",
  "upi",
  "netbanking",
  "wallet"
];

const amountPattern = [
  499,
  999,
  2999,
  4999,
  4999,
  4999,
  4999,
  9999,
  24999
];

/*
|--------------------------------------------------------------------------
| Main seed function
|--------------------------------------------------------------------------
*/

const seedDatabase = async () => {
  try {
    console.log("\n🚀 Starting RecoverAI database seed...\n");

    await connectDB();

    /*
    |--------------------------------------------------------------------------
    | Remove previous demo merchant
    |--------------------------------------------------------------------------
    */

    console.log("🧹 Removing previous Acme SaaS demo data...");

    const existingMerchant = await Merchant.findOne({
      businessName: "Acme SaaS"
    });

    if (existingMerchant) {
      await RecoveryCase.deleteMany({
        merchantId: existingMerchant._id
      });

      await Payment.deleteMany({
        merchantId: existingMerchant._id
      });

      await Customer.deleteMany({
        merchantId: existingMerchant._id
      });

      await Policy.deleteMany({
        merchantId: existingMerchant._id
      });

      await Merchant.deleteOne({
        _id: existingMerchant._id
      });
    }

    /*
    |--------------------------------------------------------------------------
    | Create merchant
    |--------------------------------------------------------------------------
    */

    console.log("🏢 Creating Acme SaaS merchant...");

    const merchant = await Merchant.create({
      name: "RecoverAI Demo Merchant",
      businessName: "Acme SaaS",
      email: "admin@acmesaas.demo",
      currency: "INR",
      razorpayConnected: false,
      razorpayMode: "test",
      isActive: true
    });

    /*
    |--------------------------------------------------------------------------
    | Create default policy
    |--------------------------------------------------------------------------
    */

    console.log("🛡️ Creating default recovery policy...");

    await Policy.create({
      merchantId: merchant._id,
      maxRetries: 3,
      minRetryIntervalHours: 6,
      maxMessages: 3,
      minMessageIntervalHours: 24,
      recoveryWindowDays: 7,
      humanEscalationThreshold: 25000,
      minimumAIConfidence: 60
    });

    /*
    |--------------------------------------------------------------------------
    | Create customers
    |--------------------------------------------------------------------------
    */

    console.log(
      `👥 Creating ${TOTAL_CUSTOMERS.toLocaleString()} customers...`
    );

    const customers = [];

    /*
     * Rahul is intentionally the first customer.
     * He will become our Golden Demo Case.
     */

    customers.push({
      merchantId: merchant._id,
      name: "Amit Singh",
      email: "amit.singh@example.demo",
      phone: "+919800000001",

      lifetimeValue: 74985,

      totalPayments: 13,
      successfulPayments: 12,
      failedPayments: 1,
      previousRecoveries: 2,

      segment: "HIGH_VALUE_HIGH_RECOVERABILITY",
      preferredChannel: "WHATSAPP",
      subscriptionStatus: "ACTIVE",
      recoveryProbability: 87
    });

    for(let i=1; i<TOTAL_CUSTOMERS; i++){
      const firstName = firstNames[i % firstNames.length];
      const lastName = lastNames[Math.floor(i / firstNames.length) % lastNames.length];

      const name = `${firstName} ${lastName}`;

      const lifetimeValue = 999 + ((i * 137) % 249000);

      let segment;
      if (lifetimeValue >= 50000) {
        segment = i % 3 === 0
                            ? "HIGH_VALUE_HIGH_RECOVERABILITY"
                            : "HIGH_VALUE_LOW_RECOVERABILITY";
      } else {
        segment = i % 4 === 0
                            ? "LOW_VALUE_LOW_RECOVERABILITY"
                            : "LOW_VALUE_HIGH_RECOVERABILITY";
      }

      customers.push({
        merchantId: merchant._id,
        name,
        email: `customer${i + 1}@demo.recoverai.local`,
        phone: `+9198${String(10000000 + i).slice(-8)}`,
        lifetimeValue,
        totalPayments: 0,
        successfulPayments: 0,
        failedPayments: 0,
        previousRecoveries: i % 7 === 0 ? 1 : 0,
        segment,
        preferredChannel: i % 3 === 0  ? "WHATSAPP" :  i % 3 === 1 ? "EMAIL" : "SMS",
        subscriptionStatus:  i % 5 === 0 ? "ACTIVE" : "NONE",
        recoveryProbability:  40 + (i % 56)
      });
    }

    const insertedCustomers =  await Customer.insertMany(customers);

    console.log( `✅ ${insertedCustomers.length.toLocaleString()} customers created` );

    const rahul =  insertedCustomers[0];

    /*
    |--------------------------------------------------------------------------
    | Rahul historical successful payments
    |--------------------------------------------------------------------------
    */

    console.log( "💳 Creating Rahul's historical successful payments..." );

    const rahulHistoricalPayments = [];

    for (let i = 1; i <= 12; i++) {
      rahulHistoricalPayments.push({
        merchantId: merchant._id,
        customerId: rahul._id,
        razorpayPaymentId: `pay_demo_rahul_${String(i).padStart(3, "0")}`,
        razorpayOrderId: `order_demo_rahul_${String(i).padStart(3, "0")}`,
        amount: 4999,
        currency: "INR",
        status: "CAPTURED",
        method: "upi",
        isSimulation: true,
        paidAt: new Date(
          Date.now() - i * 30 * 24 * 60 * 60 * 1000
        )
      });
    }

    await Payment.insertMany( rahulHistoricalPayments );

    /*
    |--------------------------------------------------------------------------
    | Create 250 failed payments
    |--------------------------------------------------------------------------
    */

    console.log(
      `❌ Creating ${TOTAL_FAILED_PAYMENTS} failed payment events...`
    );

    const failedPayments = [];

    let totalAtRisk = 0;

    for ( let i = 0; i < TOTAL_FAILED_PAYMENTS; i++ ) {
      /*
       * Make Rahul's current failed payment the first failed event.
       */
      const customer =
        i === 0
          ? rahul
          : insertedCustomers[
              (i % (insertedCustomers.length - 1)) + 1
            ];

      /*
       * Most demo payments are ₹4,999.
       * The final amounts are adjusted so that
       * the total revenue at risk is exactly ₹12,48,500.
       */
      let amount;

      if (i < 248) {
        amount = 4999;
      } else if (i === 248) {
        amount = 3749;
      } else {
        amount = 4999;
      }

      const failure =
        i === 0
          ? failureTypes[0]
          : failureTypes[i % failureTypes.length];

      const payment = {
        merchantId: merchant._id,
        customerId: customer._id,

        razorpayPaymentId: `pay_demo_failed_${String(i + 1).padStart(4, "0")}`,

        razorpayOrderId: `order_demo_failed_${String(i + 1).padStart(4, "0")}`,
        amount,
        currency: "INR",
        status: "FAILED",
        method:
          paymentMethods[
            i % paymentMethods.length
          ],

        failureCode: failure.code,
        failureReason: failure.reason,
        isSimulation: true,

        createdAt: new Date(
          Date.now() -
            (i % 14) * 24 * 60 * 60 * 1000
        )
      };

      failedPayments.push(payment);

      totalAtRisk += amount;
    }

    const insertedPayments = 
      await Payment.insertMany(
        failedPayments
      );

    console.log(
      `✅ ${insertedPayments.length} failed payments created`
    );

    console.log(
      `💰 Total revenue at risk: ₹${totalAtRisk.toLocaleString("en-IN")}`
    );

    /*
    |--------------------------------------------------------------------------
    | Update customer statistics
    |--------------------------------------------------------------------------
    */

    console.log(
      "📊 Updating customer payment statistics..."
    );

    const customerUpdates = [];

    for (const payment of insertedPayments) {
      customerUpdates.push({
        updateOne: {
          filter: {
            _id: payment.customerId
          },

          update: {
            $inc: {
              totalPayments: 1,
              failedPayments: 1
            }
          }
        }
      });
    }

    /*
     * Rahul already has 12 historical successful
     * payments and 1 failed payment.
     */
    await Customer.bulkWrite(
      customerUpdates
    );

    /*
    |--------------------------------------------------------------------------
    | Create recovery cases
    |--------------------------------------------------------------------------
    */

    console.log(
      "🤖 Creating recovery cases..."
    );

    const recoveryCases = [];

    for ( let i = 0; i < insertedPayments.length; i++ ) {
      const payment = insertedPayments[i];
      const customer = 
        insertedCustomers.find(
          (c) =>
            c._id.toString() ===
            payment.customerId.toString()
        );

      const failure =
        i === 0
          ? failureTypes[0]
          : failureTypes[
              i % failureTypes.length
            ];

      let recoveryProbability;
      let riskScore;
      let recommendedAction;
      let priorityScore;
      let evidence;

      /*
       * GOLDEN CASE
       */
      if (i === 0) {
        recoveryProbability = 87;
        riskScore = 82;
        recommendedAction = "RETRY_PAYMENT";
        priorityScore = 4350;

        evidence = [
          "Customer has 12 previous successful payments",
          "Payment method is still valid",
          "Current failure appears temporary",
          "Strong customer payment history",
          "Retry is allowed by merchant policy"
        ];
      }

      /*
       * Expired payment method
       */
      else if ( failure.rootCause ===  "EXPIRED_PAYMENT_METHOD" ) {
        recoveryProbability = 72 + (i % 15);

        riskScore = 70 + (i % 20);

        recommendedAction = "REQUEST_PAYMENT_METHOD_UPDATE";

        priorityScore = payment.amount * (recoveryProbability / 100);

        evidence = [
          "Payment method appears expired",
          "Retrying without updating payment method has low value",
          "Customer should update payment details"
        ];
      }

      /*
       * High-value customer
       */
      else if ( payment.amount >= 24999 || customer.lifetimeValue >= 100000 ) {
        recoveryProbability = 55 + (i % 30);

        riskScore = 75 + (i % 20);

        recommendedAction = "HUMAN_ESCALATION";

        priorityScore = payment.amount * (recoveryProbability / 100);

        evidence = [
          "High-value revenue is at risk",
          "Human intervention is justified",
          "Case exceeds automated escalation threshold"
        ];
      }

      /*
       * Temporary failure
       */
      else if ( failure.rootCause === "TEMPORARY_BANK_FAILURE" ) {
        recoveryProbability = 65 + (i % 30);

        riskScore = 65 + (i % 25);

        recommendedAction = "RETRY_PAYMENT";

        priorityScore = payment.amount * (recoveryProbability / 100);

        evidence = [
          "Failure appears temporary",
          "Retry may recover payment",
          "Automated retry is within policy"
        ];
      }

      /*
       * Insufficient funds / other
       */
      else {
        recoveryProbability = 35 + (i % 35);

        riskScore = 50 + (i % 35);

        recommendedAction = "SEND_PAYMENT_LINK";

        priorityScore =  payment.amount * (recoveryProbability / 100);

        evidence = [
          "Payment failed",
          "Customer requires a new payment attempt",
          "Payment link provides a low-cost recovery path"
        ];
      }

      const expectedRecovery =
        Math.round(
          payment.amount * (recoveryProbability / 100)
        );

      const timeline = [
        {
          event: "REVENUE_RISK_DETECTED",
          description:
            `₹${payment.amount.toLocaleString(
              "en-IN"
            )} payment identified as at risk`,

          timestamp: payment.createdAt
        },

        {
          event: "CASE_CREATED",
          description:
            "Recovery case created for AI analysis",

          timestamp: new Date(
            payment.createdAt.getTime() + 1000
          )
        }
      ];

      if (i === 0) {
        timeline.push(
          {
            event: "ROOT_CAUSE_IDENTIFIED",
            description:
              "Temporary bank failure detected with 91% confidence",

            timestamp: new Date(
              payment.createdAt.getTime() +
                2000
            )
          },

          {
            event: "RECOVERY_DECISION",
            description:
              "Retry after 6 hours selected by AI",

            timestamp: new Date(
              payment.createdAt.getTime() +
                3000
            )
          }
        );
      }

      const recoveryCase = {
        merchantId: merchant._id,

        customerId : payment.customerId,

        paymentId: payment._id,

        amountAtRisk: payment.amount,

        riskScore,

        recoveryProbability,

        expectedRecovery,

        priorityScore,

        rootCause: failure.rootCause,

        diagnosisConfidence: i === 0 ? 91 : 70 + (i % 25),

        recommendedAction,

        currentAction: recommendedAction,

        status:
          i === 0
            ? "PENDING_ACTION"
            : "DETECTED",

        attempts: 0,

        amountRecovered: 0,

        nextActionAt:
          recommendedAction ===
          "RETRY_PAYMENT"
            ? new Date(
                Date.now() +
                  6 * 60 * 60 * 1000
              )
            : undefined,

        aiReason:
          i === 0
            ? "Strong historical payment behavior and a temporary failure pattern make retry the most appropriate recovery action."
            : `AI recommends ${recommendedAction.toLowerCase()} based on the detected failure and customer context.`,

        evidence,

        timeline
      };

      recoveryCases.push(
        recoveryCase
      );
    }

    await RecoveryCase.insertMany(
      recoveryCases
    );

    console.log(
      `✅ ${recoveryCases.length} recovery cases created`
    );

    /*
    |--------------------------------------------------------------------------
    | Final summary
    |--------------------------------------------------------------------------
    */

    console.log("\n");
    console.log(
      "══════════════════════════════════════"
    );
    console.log(
      "        RECOVERAI SEED COMPLETE"
    );
    console.log(
      "══════════════════════════════════════"
    );

    console.log(
      `🏢 Merchant: ${merchant.businessName}`
    );

    console.log(
      `👥 Customers: ${insertedCustomers.length.toLocaleString()}`
    );

    console.log(
      `❌ Failed payments: ${insertedPayments.length}`
    );

    console.log(
      `🤖 Recovery cases: ${recoveryCases.length}`
    );

    console.log(
      `💰 Revenue at risk: ₹${totalAtRisk.toLocaleString(
        "en-IN"
      )}`
    );

    console.log(
      `⭐ Golden case: Rahul Sharma — ₹4,999`
    );

    console.log(
      "══════════════════════════════════════\n"
    );

    await mongoose.connection.close();

    process.exit(0);
  } catch (error) {
    console.error(
      "\n❌ Seed failed:"
    );

    console.error(
      error
    );

    await mongoose.connection.close();

    process.exit(1);
  }
};

seedDatabase();