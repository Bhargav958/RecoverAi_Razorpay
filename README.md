# RecoverAI

> **AI-powered revenue recovery platform for Razorpay merchants**

RecoverAI is a merchant-facing AI revenue recovery platform designed for **Razorpay AI Buildathon — Track 03: AI Revenue Recovery**.

The goal is simple:

> **Find revenue that is slipping away and win it back.**

RecoverAI analyzes failed payments, evaluates the customer's payment history, estimates recovery potential, and prepares the foundation for a bounded recovery workflow.

The project is being built incrementally, starting with a reliable backend and database-driven recovery pipeline before adding AI diagnosis, policy enforcement, recovery execution, and the frontend command center.

---

# 1. Problem

Businesses lose revenue when payments fail.

A normal payment dashboard can tell a merchant:

> Payment failed.

RecoverAI is intended to answer more useful questions:

* How much revenue is currently at risk?
* Which customers/payments are worth recovering?
* Why did the payment fail?
* How likely is recovery?
* What action should be taken?
* Was the revenue actually recovered?
* When should the recovery process stop?
* What exactly did the system do?

The complete product will eventually follow:

```text
Detect
   ↓
Diagnose
   ↓
Predict
   ↓
Decide
   ↓
Policy Check
   ↓
Act
   ↓
Verify
   ↓
Recover
   ↓
Stop
   ↓
Audit
```

---

# 2. Target User

RecoverAI is primarily designed for **merchants/businesses using Razorpay**.

Potential users include:

* SaaS businesses
* Subscription businesses
* E-commerce businesses
* Online service providers
* Finance teams
* Revenue operations teams
* Accounts receivable teams

The merchant is the primary RecoverAI user.

The merchant's customers do not need to use the RecoverAI dashboard.

---

# 3. Product Architecture

The intended architecture is:

```text
                 MERCHANT
                     │
               Razorpay Account
                     │
              ┌──────┴──────┐
              │             │
           API          Webhooks
              │             │
              └──────┬──────┘
                     ↓
                RecoverAI
                     ↓
              Database Layer
                     ↓
              Revenue Risk
                  Engine
                     ↓
                AI Diagnosis
                     ↓
               Policy Engine
                     ↓
             Recovery Action
                     ↓
                  Razorpay
                     ↓
              Payment Result
                     ↓
              Verification
                     ↓
          Recovery Metrics + Audit
```

The project also supports a future **Simulation Mode** so the complete backend workflow can be tested without depending exclusively on live payment events.

The implementation plan intentionally defines both Simulation and Live Razorpay modes, with the simulation executing the real backend processing pipeline rather than relying on frontend-only mock animations.

---

# 4. Current Technology Stack

## Backend

* Node.js
* Express.js
* MongoDB
* Mongoose
* dotenv
* CORS
* Razorpay SDK
* Google Gemini / AI API
* JWT
* bcryptjs

## Frontend

Planned:

* React
* Vite
* Tailwind CSS
* React Router
* Recharts
* Lucide Icons

The implementation plan specifies this React/Vite/Tailwind frontend stack.

---

# 5. Current Project Structure

```text
RecoverAI/
│
├── backend/
│   ├── src/
│   │   ├── config/
│   │   │   └── db.js
│   │   │
│   │   ├── controllers/
│   │   │   └── recoveryController.js
│   │   │
│   │   ├── models/
│   │   │   ├── Merchant.js
│   │   │   ├── Customer.js
│   │   │   ├── Payment.js
│   │   │   ├── RecoveryCase.js
│   │   │   ├── RecoveryAction.js
│   │   │   └── Policy.js
│   │   │
│   │   ├── routes/
│   │   │   └── recoveryRoutes.js
│   │   │
│   │   ├── services/
│   │   │   ├── riskEngine.js
│   │   │   ├── recoveryAnalysisService.js
│   │   │   └── findGoldenCase.js
│   │   │
│   │   └── seed/
│   │       └── seedData.js
│   │
│   ├── server.js
│   ├── package.json
│   └── .env
│
├── frontend/
│
├── .env.example
└── package.json
```

This structure will expand as the AI diagnosis, policy engine, recovery execution, verification, audit trail, webhook handling, and frontend are implemented.

The planned architecture also includes dedicated services for risk calculation, AI diagnosis, policy enforcement, recovery actions, verification, orchestration, metrics, audit logging, simulation, and Razorpay integration.

---

# 6. Database

RecoverAI currently uses **MongoDB Atlas**.

The main entities designed so far are:

```text
Merchant
Customer
Payment
RecoveryCase
RecoveryAction
Policy
```

Additional entities planned later include:

```text
AuditLog
WebhookEvent
PromiseToPay
```

The implementation plan defines these entities as the core database model.

---

# 7. Merchant

A merchant represents the business using RecoverAI.

Example:

```text
Business:
Acme SaaS

Currency:
INR

Razorpay Mode:
Test
```

The merchant is the parent entity for customers, payments, policies, and recovery cases.

---

# 8. Customer

A customer stores the context necessary for recovery decisions.

Important fields include:

```text
Name
Email
Phone
Lifetime Value
Total Payments
Successful Payments
Failed Payments
Previous Recoveries
Customer Segment
Preferred Communication Channel
Subscription Status
Recovery Probability
```

This allows RecoverAI to analyze a payment using customer history instead of treating every failure identically.

---

# 9. Payment

Payments contain normalized payment information such as:

```text
Merchant
Customer
Razorpay Payment ID
Razorpay Order ID
Amount
Currency
Status
Payment Method
Failure Code
Failure Reason
Simulation Flag
Paid At
```

The payment becomes the initial source for detecting a potential revenue-recovery case.

---

# 10. Recovery Case

The **RecoveryCase** is the core business entity of RecoverAI.

A failed/risky payment can become a recovery case.

A case contains:

```text
Amount at Risk
Risk Score
Recovery Probability
Expected Recovery
Priority Score
Root Cause
Diagnosis Confidence
Recommended Action
Current Action
Status
Attempts
Amount Recovered
Next Action Time
Stopping Reason
AI Reason
Evidence
Timeline
```

Possible statuses:

```text
DETECTED
ANALYZING
ACTION_SELECTED
PENDING_ACTION
ACTION_EXECUTED
VERIFYING
RECOVERED
FAILED
ESCALATED
STOPPED
```

These statuses represent the intended lifecycle of the recovery workflow.

---

# 11. Recovery Action

Every recovery intervention will eventually be represented by a RecoveryAction.

Supported action types currently planned:

```text
RETRY_PAYMENT
REQUEST_PAYMENT_METHOD_UPDATE
SEND_PAYMENT_LINK
SEND_EMAIL
SEND_SMS_OR_WHATSAPP
HUMAN_ESCALATION
```

Each action stores information such as:

```text
Action Type
Target Channel
Reason
Status
Cost Tier
Scheduled Time
Execution Time
Result
Amount Recovered
Provider Reference
```

---

# 12. Policy

RecoverAI will use a deterministic policy layer around AI recommendations.

The intended policy includes:

```text
Maximum Retries
Minimum Retry Interval
Maximum Messages
Minimum Message Interval
Recovery Window
Human Escalation Threshold
Minimum AI Confidence
```

This prevents the AI from executing unrestricted financial or communication actions.

The implementation plan explicitly identifies the deterministic policy layer as a safety boundary around AI-generated recommendations.

---

# 13. Seed Data

The current database contains a fictional merchant:

```text
Acme SaaS
```

The seed dataset contains:

```text
12,482 customers
250 failed payment events
250 recovery cases
₹12,48,500 revenue at risk
```

The implementation plan specifies the Acme SaaS dataset and a dedicated Golden Demo Case.

All demo information is fictional.

---

# 14. Golden Demo Case

The current Golden Case is:

```text
Customer:
Amit Singh

Amount:
₹4,999

Failure:
Temporary bank failure

Previous successful payments:
12

Recovery probability:
approximately 87%
```

This case is intentionally designed to demonstrate the complete future recovery workflow.

The planned successful flow is:

```text
Payment Failed
      ↓
Case Created
      ↓
Temporary Failure Diagnosed
      ↓
Risk / Recovery Analysis
      ↓
Recovery Recommendation
      ↓
Policy Approval
      ↓
Recovery Action
      ↓
Payment Succeeds
      ↓
₹4,999 Recovered
      ↓
Workflow Stops
      ↓
Audit Created
```

---

# 15. Risk Engine

The first intelligence component implemented is the **Risk Engine**.

File:

```text
backend/src/services/riskEngine.js
```

It calculates:

```text
Risk Score
Recovery Probability
Expected Recovery
Priority Score
```

The planned architecture identifies these as the primary outputs of the risk engine.

## Risk Score

A score from:

```text
0 → 100
```

representing the level of revenue risk.

## Recovery Probability

A percentage:

```text
0% → 100%
```

representing the estimated likelihood that the payment can be recovered.

## Expected Recovery

Calculated conceptually as:

```text
Amount at Risk × Recovery Probability
```

## Priority Score

Used to prioritize cases based on factors such as:

```text
Amount
Recovery Probability
Customer Value
Risk/Urgency
```

---

# 16. Current Risk Engine Test

The Risk Engine has been successfully tested using the Golden Case data.

Current test example:

```text
Customer:
Amit Singh

Amount:
₹4,999

Risk Score:
47/100

Recovery Probability:
87%

Expected Recovery:
₹4,349

Priority Score:
5436
```

These values are currently generated by deterministic heuristics in the Risk Engine.

The exact scoring formulas will evolve as the recovery model becomes more sophisticated.

---

# 17. MongoDB-Backed Risk Analysis

The Risk Engine is now connected to real MongoDB data.

Current flow:

```text
Recovery Case ID
      ↓
MongoDB
      ↓
Load Payment
      ↓
Load Customer
      ↓
Risk Engine
      ↓
Calculate:
    Risk Score
    Recovery Probability
    Expected Recovery
    Priority Score
      ↓
Update RecoveryCase
```

Current API:

```http
POST /api/recovery/cases/:id/analyze
```

Example:

```http
POST http://localhost:5000/api/recovery/cases/6a8e905e4fa27922045eff3b/analyze
```

After analysis, the RecoveryCase is currently moved to:

```text
ANALYZING
```

and its calculated risk fields are updated.

---

# 18. Current API

### Health Check

```http
GET /api/health
```

### Get Recovery Case

```http
GET /api/recovery/cases/:id
```

### Analyze Recovery Case

```http
POST /api/recovery/cases/:id/analyze
```

---

# 19. Current Recovery Flow

At the current stage, RecoverAI supports:

```text
MongoDB
   ↓
Recovery Case
   ↓
Payment + Customer lookup
   ↓
Risk Engine
   ↓
Risk Analysis
   ↓
Recovery Case updated
```

The case currently stops at:

```text
ANALYZING
```

because the next stage—AI diagnosis—has not yet been implemented.

---

# 20. Razorpay Integration Status

Razorpay Test Mode has been prepared for future integration.

The project is intended to support:

```text
Razorpay APIs
Razorpay Webhooks
Payment Events
Payment Verification
Payment Links
```

The implementation plan includes a dedicated Razorpay service and webhook processing with event-idempotency tracking.

The webhook endpoint will be added later after the local recovery pipeline is complete.

---

# 21. Current Development Status

## Completed

* [x] Project structure
* [x] Node.js backend
* [x] Express server
* [x] MongoDB Atlas connection
* [x] Environment configuration
* [x] Merchant model
* [x] Customer model
* [x] Payment model
* [x] RecoveryCase model
* [x] RecoveryAction model
* [x] Policy model
* [x] Seed system
* [x] Acme SaaS demo data
* [x] 12,482 demo customers
* [x] 250 failed payments
* [x] 250 recovery cases
* [x] ₹12.48L demo revenue-at-risk dataset
* [x] Amit Singh Golden Case
* [x] Deterministic Risk Engine
* [x] MongoDB-backed recovery analysis
* [x] Recovery case analysis API

## In Progress / Next

* [ ] AI Diagnosis Service
* [ ] Root-cause analysis
* [ ] AI recovery recommendation
* [ ] Policy Engine
* [ ] Recovery Action Service
* [ ] Verification Service
* [ ] Stopping Rules
* [ ] Audit Log
* [ ] Recovery Metrics
* [ ] Simulation Engine
* [ ] Razorpay Webhooks
* [ ] Frontend Command Center

---

# 22. Planned Final Architecture

The final intended architecture is:

```text
                RAZORPAY
             /           \
            API          Webhook
             \           /
              \         /
               RECOVERAI
                   │
                   ▼
              MongoDB
                   │
                   ▼
           Revenue Risk Engine
                   │
                   ▼
             AI Diagnosis
                   │
                   ▼
           Recovery Decision
                   │
                   ▼
            Policy Engine
                   │
                   ▼
          Recovery Action
                   │
                   ▼
             Razorpay API
                   │
                   ▼
             Verification
                   │
          ┌────────┴────────┐
          ▼                 ▼
   Recovered Revenue     Audit Trail
          │
          ▼
       Dashboard
```

The broader implementation plan defines the intended complete orchestration as:

```text
Detect
→ Diagnose
→ Predict
→ Decide
→ Policy
→ Act
→ Verify
→ Stop
→ Audit
```

---

# 23. Running the Project

## Backend

```bash
cd backend
npm run dev
```

Backend:

```text
http://localhost:5000
```

Health check:

```text
http://localhost:5000/api/health
```

## Seed Database

```bash
cd backend
npm run seed
```

The seed command populates the fictional Acme SaaS dataset.

---

# 24. Environment Variables

Create:

```text
backend/.env
```

with the required values:

```env
PORT=5000

MONGODB_URI=

JWT_SECRET=

RAZORPAY_KEY_ID=
RAZORPAY_KEY_SECRET=
RAZORPAY_WEBHOOK_SECRET=

AI_API_KEY=
```

Do not commit real credentials to Git.

---

# 25. Product Vision

RecoverAI is being built around one central idea:

> **Don't just identify lost revenue. Recover it.**

The final system should allow a merchant to see:

```text
Revenue at Risk
        ↓
Why it is at Risk
        ↓
What RecoverAI recommends
        ↓
What RecoverAI is allowed to do
        ↓
What RecoverAI actually did
        ↓
Whether payment succeeded
        ↓
How much money was recovered
        ↓
Why the workflow stopped
```

The dashboard is the interface.

The **revenue recovery workflow is the product**.
