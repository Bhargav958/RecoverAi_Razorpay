import dotenv from "dotenv";
import mongoose from "mongoose";

import connectDB from "../config/db.js";

import Merchant from "../models/Merchant.js";
import Customer from "../models/Customer.js";
import Payment from "../models/Payment.js";
import RecoveryCase from "../models/RecoveryCase.js";
import RecoveryAction from "../models/RecoveryAction.js";
import Policy from "../models/Policy.js";
import AuditLog from "../models/AuditLog.js";
import WebhookEvent from "../models/WebhookEvent.js";

import { calculateRisk } from "../services/riskEngine.js";

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
| Demo customer names
|--------------------------------------------------------------------------
|
| Large enough pool so the Command Center does not look like
| the same few customers are repeatedly appearing.
|
|--------------------------------------------------------------------------
*/

const firstNames = [
  "Aarav",
  "Aditi",
  "Aditya",
  "Akash",
  "Akshay",
  "Aman",
  "Amita",
  "Amol",
  "Ananya",
  "Aniket",
  "Anirudh",
  "Anjali",
  "Ankit",
  "Ankita",
  "Arjun",
  "Arnav",
  "Arpita",
  "Aryan",
  "Ashish",
  "Avinash",
  "Ayush",
  "Bhavna",
  "Chetan",
  "Deepak",
  "Deepika",
  "Dhruv",
  "Diya",
  "Esha",
  "Gaurav",
  "Harish",
  "Ishaan",
  "Isha",
  "Jatin",
  "Karan",
  "Kavya",
  "Kartik",
  "Kavita",
  "Kiran",
  "Krishna",
  "Manish",
  "Meera",
  "Mohit",
  "Naina",
  "Naman",
  "Neha",
  "Nikhil",
  "Nisha",
  "Pallavi",
  "Pankaj",
  "Pooja",
  "Pranav",
  "Prateek",
  "Priya",
  "Rahul",
  "Rakesh",
  "Rhea",
  "Rishabh",
  "Ritika",
  "Rohan",
  "Rohit",
  "Sakshi",
  "Sameer",
  "Sanjay",
  "Sanya",
  "Sarika",
  "Shivam",
  "Shreya",
  "Siddharth",
  "Sneha",
  "Sonal",
  "Sourabh",
  "Sumit",
  "Tanvi",
  "Tarun",
  "Tanya",
  "Varun",
  "Vikas",
  "Vikram",
  "Vineet",
  "Yash",
  "Zoya"
];

const lastNames = [
  "Agarwal",
  "Ahluwalia",
  "Bansal",
  "Batra",
  "Bhatt",
  "Bose",
  "Chakraborty",
  "Chandra",
  "Chauhan",
  "Das",
  "Desai",
  "Dutta",
  "Ghosh",
  "Goel",
  "Goyal",
  "Gupta",
  "Iyer",
  "Jain",
  "Jaiswal",
  "Joshi",
  "Kapur",
  "Kapoor",
  "Khan",
  "Kohli",
  "Kulkarni",
  "Malhotra",
  "Mehta",
  "Menon",
  "Mishra",
  "Mukherjee",
  "Nair",
  "Naik",
  "Narayanan",
  "Patel",
  "Pillai",
  "Prasad",
  "Rao",
  "Reddy",
  "Roy",
  "Saxena",
  "Sethi",
  "Shah",
  "Sharma",
  "Shetty",
  "Singh",
  "Sinha",
  "Srivastava",
  "Subramanian",
  "Tandon",
  "Tripathi",
  "Trivedi",
  "Varma",
  "Verma",
  "Yadav",
  "Yadav"
];

const failureTypes = [
  {
    code: "BANK_TEMPORARY_FAILURE",
    reason: "Temporary bank-side payment failure"
  },
  {
    code: "CARD_EXPIRED",
    reason: "Payment method has expired"
  },
  {
    code: "INSUFFICIENT_FUNDS",
    reason: "Insufficient funds"
  },
  {
    code: "AUTHENTICATION_FAILED",
    reason: "Payment authentication failed"
  },
  {
    code: "GATEWAY_TIMEOUT",
    reason: "Payment gateway timeout"
  }
];

const paymentMethods = [
  "card",
  "upi",
  "netbanking",
  "wallet"
];

/*
|--------------------------------------------------------------------------
| Generate demo customer name
|--------------------------------------------------------------------------
*/

const generateCustomerName = (index) => {
  const firstName =
    firstNames[
      index % firstNames.length
    ];

  const lastName =
    lastNames[
      Math.floor(index / firstNames.length) %  lastNames.length
    ];

  return `${firstName} ${lastName}`;
};

/*
|--------------------------------------------------------------------------
| Main seed
|--------------------------------------------------------------------------
*/

const seedDatabase = async () => {
  try {
    console.log( "\n🚀 Starting RecoverAI database seed...\n" );

    await connectDB();

    console.log(
      "🧹 Clearing previous webhook events..."
    );

    await WebhookEvent.deleteMany({});
    /*
    |--------------------------------------------------------------------------
    | Remove previous demo data
    |--------------------------------------------------------------------------
    */

    const existingMerchant =
      await Merchant.findOne({
        businessName: "Acme SaaS"
      });

    if (existingMerchant) {
      console.log( "🧹 Removing previous Acme SaaS demo data..." );

      /*
       * Delete audit logs first.
       */

      await AuditLog.deleteMany({
        merchantId: existingMerchant._id
      });

      await WebhookEvent.deleteMany({
        merchantId:
          existingMerchant._id
      });

      /*
       * Find old recovery cases so their actions
       * can also be removed.
       */

      const oldRecoveryCases =
        await RecoveryCase.find({
          merchantId:
            existingMerchant._id
        }).select("_id");

      const oldRecoveryCaseIds =
        oldRecoveryCases.map(
          (item) => item._id
        );

      if ( oldRecoveryCaseIds.length > 0 ) {
        await RecoveryAction.deleteMany({
          recoveryCaseId: {
            $in: oldRecoveryCaseIds
          }
        });
      }

      await RecoveryCase.deleteMany({
        merchantId: existingMerchant._id
      });

      await Payment.deleteMany({
        merchantId:  existingMerchant._id
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

    console.log( "🏢 Creating Acme SaaS merchant..." );

    const merchant =
      await Merchant.create({
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
    | Create default recovery policy
    |--------------------------------------------------------------------------
    */

    console.log( "🛡️ Creating default recovery policy..." );

    await Policy.create({
      merchantId:  merchant._id,

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

    console.log( `👥 Creating ${TOTAL_CUSTOMERS.toLocaleString()} customers...` );

    const customers = [];

    /*
     * Amit is our Golden Case.
     */

    customers.push({
      merchantId: merchant._id,

      name: "Amit Singh",

      email:  "amit.singh@example.demo",

      phone: "+919800000001",

      lifetimeValue: 74985,

      /*
       * 12 historical successful
       * + 1 current failed
       * = 13 total
       */

      totalPayments: 13,

      successfulPayments: 12,

      failedPayments: 1,

      previousRecoveries: 2,

      segment: "HIGH_VALUE_HIGH_RECOVERABILITY",

      preferredChannel: "WHATSAPP",

      subscriptionStatus: "ACTIVE",

      recoveryProbability: 87
    });

    /*
     * Remaining customers.
     */

    for ( let i = 1; i < TOTAL_CUSTOMERS; i++ ) {
      const name = generateCustomerName(i);

      const lifetimeValue = 999 +  ((i * 137) % 249000);

      let segment;

      if ( lifetimeValue >= 100000 ) {
        segment =
          i % 3 === 0
            ? "HIGH_VALUE_HIGH_RECOVERABILITY"
            : "HIGH_VALUE_LOW_RECOVERABILITY";
      } else {
        segment =
          i % 4 === 0
            ? "LOW_VALUE_LOW_RECOVERABILITY"
            : "LOW_VALUE_HIGH_RECOVERABILITY";
      }

      customers.push({
        merchantId: merchant._id,

        name,

        email: `customer${i + 1}@demo.recoverai.local`,

        phone:
          `+9198${String(
            10000000 + i
          ).slice(-8)}`,

        lifetimeValue,

        totalPayments: 0,

        successfulPayments: 0,

        failedPayments: 0,

        previousRecoveries:  i % 17 === 0 ? 1 : 0,

        segment,

        preferredChannel:
          i % 3 === 0
            ? "WHATSAPP"
            : i % 3 === 1
              ? "EMAIL"
              : "SMS",

        subscriptionStatus: i % 5 === 0  ? "ACTIVE"  : "NONE",

        recoveryProbability:  40 + (i % 56)
      });
    }

    const insertedCustomers =
      await Customer.insertMany(
        customers
      );

    console.log(  `✅ ${insertedCustomers.length.toLocaleString()} customers created`  );

    /*
    |--------------------------------------------------------------------------
    | Amit's historical successful payments
    |--------------------------------------------------------------------------
    */

    const amit = insertedCustomers[0];

    console.log( "💳 Creating Amit's historical successful payments..." );

    const amitHistoricalPayments = [];

    for (  let i = 1; i <= 12; i++ ) {
      amitHistoricalPayments.push({
        merchantId: merchant._id,

        customerId: amit._id,

        razorpayPaymentId:
          `pay_demo_amit_${String(
            i
          ).padStart(3, "0")}`,

        razorpayOrderId:
          `order_demo_amit_${String(
            i
          ).padStart(3, "0")}`,

        amount: 4999,

        currency:  "INR",

        status: "CAPTURED",

        method: "upi",

        isSimulation: true,

        paidAt:
          new Date(
            Date.now() -  i *  30 *  24 *  60 *  60 *  1000
          )
      });
    }

    await Payment.insertMany(
      amitHistoricalPayments
    );

    /*
    |--------------------------------------------------------------------------
    | Create failed payments
    |--------------------------------------------------------------------------
    |
    | First 250 customers receive one failed payment.
    |
    | This makes Command Center cases mostly unique by customer
    | while still preserving realistic customer histories.
    |
    */

    console.log( `❌ Creating ${TOTAL_FAILED_PAYMENTS} failed payment events...` );

    const failedPayments = [];

    let totalAtRisk = 0;

    for ( let i = 0;  i < TOTAL_FAILED_PAYMENTS; i++ ) {
      /*
       * Amit is index 0.
       * Every other failed payment uses a distinct customer.
       */

      const customer =  i === 0  ? amit : insertedCustomers[i];

      let amount;

      /*
       * Preserve exact baseline:
       *
       * ₹12,48,500
       */

      if (i < 248) {
        amount = 4999;
      } else if (i === 248) {
        amount = 3749;
      } else {
        amount = 4999;
      }

      /*
       * Amit gets the temporary bank failure.
       */

      const failure =
        i === 0
          ? failureTypes[0]
          : failureTypes[
              i %
                failureTypes.length
            ];

      const payment = {
        merchantId: merchant._id,

        customerId: customer._id,

        razorpayPaymentId:
          `pay_demo_failed_${String(
            i + 1
          ).padStart(4, "0")}`,

        razorpayOrderId:
          `order_demo_failed_${String(
            i + 1
          ).padStart(4, "0")}`,

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

        createdAt:
          new Date(
            Date.now() -  (i % 14) * 24 *  60 *  60 *  1000
          )
      };

      failedPayments.push(
        payment
      );

      totalAtRisk +=  amount;
    }

    const insertedPayments =
      await Payment.insertMany(
        failedPayments
      );

    console.log(  `✅ ${insertedPayments.length} failed payments created`  );

    console.log(
      `💰 Total revenue at risk: ₹${totalAtRisk.toLocaleString(
        "en-IN"
      )}`
    );

    /*
    |--------------------------------------------------------------------------
    | Update customer statistics
    |--------------------------------------------------------------------------
    |
    | Amit already includes his current failed payment
    | in his initial statistics.
    |
    |--------------------------------------------------------------------------
    */

    console.log( "📊 Updating customer payment statistics..." );

    const customerUpdates = [];

    for ( let i = 0; i < insertedPayments.length; i++ ) {
      const payment = insertedPayments[i];

      /*
       * Amit already has:
       *
       * totalPayments = 13
       * successfulPayments = 12
       * failedPayments = 1
       *
       * Therefore don't increment his values again.
       */

      if (  payment.customerId.toString() ===  amit._id.toString() ) {
        continue;
      }

      /*
       * Update in-memory customer object too.
       * We need those updated statistics immediately
       * when calculating the risk score below.
       */

      const customer = insertedCustomers[i];

      customer.totalPayments += 1;

      customer.failedPayments += 1;

      customerUpdates.push({
        updateOne: {
          filter: {
            _id:
              customer._id
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

    if ( customerUpdates.length > 0 ) {
      await Customer.bulkWrite(
        customerUpdates
      );
    }

    /*
    |--------------------------------------------------------------------------
    | Create Recovery Cases
    |--------------------------------------------------------------------------
    |
    | IMPORTANT:
    |
    | Risk metrics ARE calculated during seed so cases can be
    | prioritized in the Command Center.
    |
    | AI diagnosis fields remain untouched.
    |
    |--------------------------------------------------------------------------
    */

    console.log( "🧠 Calculating risk and creating recovery cases..." );

    const recoveryCases = [];

    for ( let i = 0; i < insertedPayments.length; i++ ) {
      const payment = insertedPayments[i];

      const customer = insertedCustomers[i];

      /*
       * Calculate deterministic risk.
       */

      const risk =
        calculateRisk({
          payment,
          customer
        });

      /*
       * Initial timeline contains only facts known at detection.
       */

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

          description: "Recovery case created for AI analysis.",

          timestamp: new Date( payment.createdAt.getTime() +  1000    )
        }
      ];

      /*
       * IMPORTANT:
       *
       * rootCause is UNKNOWN because AI has not analyzed
       * the case yet.
       *
       * recommendedAction is intentionally omitted.
       *
       * aiReason/evidence are empty.
       */

      const recoveryCase = {
        merchantId: merchant._id,

        customerId:  payment.customerId,

        paymentId: payment._id,

        amountAtRisk: payment.amount,

        /*
         * Deterministic risk information.
         */

        riskScore:  risk.riskScore,

        recoveryProbability:  risk.recoveryProbability,

        expectedRecovery:  risk.expectedRecovery,

        priorityScore: risk.priorityScore,

        /*
         * AI has not run yet.
         */

        rootCause: "UNKNOWN",

        diagnosisConfidence: 0,

        recommendedAction:  undefined,

        currentAction:  undefined,

        /*
         * Case is waiting for agent analysis.
         */

        status:  "DETECTED",

        attempts:  0,

        amountRecovered:  0,

        nextActionAt: null,

        stoppedReason: undefined,

        aiReason:  undefined,

        evidence:  [],

        timeline
      };

      recoveryCases.push(
        recoveryCase
      );
    }

    await RecoveryCase.insertMany(
      recoveryCases
    );

    console.log( `✅ ${recoveryCases.length} recovery cases created` );

    /*
    |--------------------------------------------------------------------------
    | Final Summary
    |--------------------------------------------------------------------------
    */

    console.log("\n");

    console.log(  "══════════════════════════════════════"  );

    console.log(   "        RECOVERAI SEED COMPLETE"  );

    console.log( "══════════════════════════════════════" );

    console.log(  `🏢 Merchant: ${merchant.businessName}`  );

    console.log(  `👥 Customers: ${insertedCustomers.length.toLocaleString()}`  );

    console.log(  `❌ Failed payments: ${insertedPayments.length}` );

    console.log ( `🤖 Recovery cases: ${recoveryCases.length}` );

    console.log( `💰 Revenue at risk: ₹${totalAtRisk.toLocaleString(  "en-IN"  )}`
    );

    console.log(  `⭐ Golden case: Amit Singh — ₹4,999` );

    console.log( "══════════════════════════════════════\n" );

    await mongoose.connection.close();

    process.exit(0);
  } catch (error) {
    console.error(  "\n❌ Seed failed:\n"  );

    console.error( error );

    await mongoose.connection.close();

    process.exit(1);
  }
};

seedDatabase();