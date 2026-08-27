# RecoverAI

## AI Revenue Recovery Platform for Razorpay Merchants

> **Find revenue that's slipping away and win it back.**

RecoverAI is an AI-powered, merchant-facing revenue recovery platform designed for the **Razorpay AI Buildathon — Track 03: AI Revenue Recovery**.

It is designed to close the loop from:

**Detect → Diagnose → Predict → Decide → Policy Check → Act → Verify → Recover → Stop → Audit**

The product is built for businesses that use Razorpay to collect payments. The merchant is the primary user of RecoverAI; the merchant's customers do not need to log into the RecoverAI dashboard.

---

## 1. Problem

Revenue can slip away through:

- Failed payments
- Subscription payment failures
- Expired payment methods
- Checkout abandonment
- Overdue receivables
- Repeated payment failures
- Temporary payment degradation
- Missed promise-to-pay commitments

A traditional payment dashboard can show that a payment failed, but it does not necessarily close the loop on recovery.

RecoverAI is designed to answer:

- Where is revenue at risk?
- Why is the payment/revenue at risk?
- How likely is recovery?
- Which intervention should be used?
- Is that intervention allowed by merchant policy?
- Was the money actually recovered?
- When should the recovery workflow stop?
- What exactly did the system do?

---

## 2. Solution

RecoverAI acts as an AI-assisted revenue-recovery operator for a merchant.

For a failed payment, the system can:

1. Detect the revenue risk.
2. Analyze customer and payment history.
3. Calculate risk score and recovery probability.
4. Ask the AI to diagnose the failure and recommend a bounded recovery action.
5. Run the recommendation through a deterministic policy engine.
6. Schedule or execute the permitted recovery action.
7. Verify the outcome.
8. Record the actual amount recovered.
9. Stop the workflow when a stopping condition is reached.
10. Record the complete lifecycle in an audit trail.

The key product metric is **measured money recovered**, not the number of AI decisions made.

---

## 3. Product Users

### Merchant / Business

The primary RecoverAI user is the business collecting payments through Razorpay.

Example demo merchant:

- **Business:** Acme SaaS
- **Currency:** INR
- **Razorpay mode:** Test

The merchant uses RecoverAI to monitor revenue risk, inspect recovery cases, understand AI decisions, configure recovery policies, and measure recovered revenue.

### Merchant's Customers

A merchant's customers are the people who owe/pay the money. They are not the primary dashboard users.

They may receive a payment link, email, SMS/WhatsApp communication, or other recovery intervention depending on the recovery workflow and merchant policy.

---

## 4. Core Recovery Workflow

```text
Payment / Revenue Event
          ↓
       Detection
          ↓
      Recovery Case
          ↓
      Risk Engine
          ↓
      AI Diagnosis
          ↓
    Recovery Decision
          ↓
    Policy Engine
          ↓
    Recovery Action
          ↓
       Execution
          ↓
      Verification
          ↓
      Payment Recovered?
        /          \
      YES            NO
       ↓              ↓
   RECOVERED      Next permitted action
       ↓              ↓
     STOP       Stop condition check
                      ↓
                    STOP
```

---

## 5. AI Safety Model

RecoverAI does **not** give an LLM unrestricted access to financial or communication APIs.

The AI produces a structured recommendation only.

```text
AI Model
   ↓
Structured Diagnosis / Recommendation
   ↓
Validation
   ↓
Deterministic Policy Engine
   ↓
Permitted Action
   ↓
Execution Service
```

This keeps the AI bounded by merchant-defined controls such as:

- Maximum retries
- Minimum retry interval
- Maximum customer messages
- Minimum message interval
- Recovery window
- Human escalation threshold
- Minimum AI confidence

If the AI recommendation violates policy, the policy layer can reject it, reschedule it, escalate it, or stop the workflow.

---

## 6. Current Core Features

### Revenue Risk Engine

Calculates:

- Risk score (0–100)
- Recovery probability (0–100%)
- Expected recovery
- Priority score

Expected recovery is conceptually:

```text
Amount at Risk × Recovery Probability
```

### AI Diagnosis

Gemini is used to produce structured diagnosis information such as:

- Root cause
- Confidence
- Recommended recovery action
- Delay
- Business reason
- Evidence
- Human approval requirement

A deterministic fallback is used if the AI service is unavailable.

### Policy Engine

The policy layer enforces merchant-defined recovery boundaries before execution.

### Recovery Action Service

Supports the recovery action abstraction for:

- Payment retry
- Payment method update request
- Payment link
- Email
- SMS / WhatsApp
- Human escalation

Simulation mode is currently used for safe end-to-end demonstration.

### Recovery Worker

The worker finds scheduled recovery actions and moves them through execution and verification.

Demo mode can explicitly process a scheduled action without waiting for its future timestamp.

### Verification

Executing an action is **not** treated as recovery.

Only a successful verification can mark the payment as recovered.

### Dynamic Metrics

Metrics are calculated from the database rather than being hard-coded in the frontend.

Key metrics include:

- Revenue at risk
- Recoverable revenue
- Targeted revenue
- Attempted revenue
- Recovered revenue
- Recovery rate
- Active recovery cases
- Total cases
- Recovered cases
- Root-cause distribution

Actual recovered revenue is based on successful recovery actions.

### Audit Trail

The system records important lifecycle events including:

- Risk analysis
- AI diagnosis
- Policy decision
- Action scheduling
- Action execution
- Verification
- Payment recovery
- Workflow stop

---

## 7. Simulation Mode

RecoverAI includes a first-class simulation mode so the complete backend workflow can be demonstrated without depending on live production payment failures.

Simulation events are processed through the real backend pipeline rather than being frontend-only animations.

The intended flow is:

```text
Simulation Event
      ↓
Database
      ↓
Risk Engine
      ↓
AI Diagnosis
      ↓
Policy Engine
      ↓
Recovery Action
      ↓
Worker
      ↓
Verification
      ↓
Metrics + Audit
```

The demo dataset includes a fictional merchant and realistic customer/payment scenarios.

---

## 8. Golden Demo Case

The project currently uses a fictional golden recovery case:

### Amit Singh

- Amount at risk: **₹4,999**
- Payment history: strong historical success rate
- Failure: temporary bank-side payment failure
- Recovery probability: approximately **87%** in the current seeded scenario
- AI recommendation: retry after a bounded delay

The desired Golden Case story is:

```text
Payment Failed
      ↓
Risk Calculated
      ↓
Temporary Bank Failure Diagnosed
      ↓
Retry Recommended
      ↓
Policy Approved
      ↓
Retry Scheduled
      ↓
Worker Executes Retry
      ↓
Payment Verified
      ↓
₹4,999 Recovered
      ↓
Workflow Stopped
```

The Golden Case is intentionally kept as a clean, explainable demonstration of the entire Track 03 workflow.

---

## 9. Current Demo Dataset

The seed dataset currently creates:

- **Merchant:** Acme SaaS
- **Customers:** 12,482
- **Failed payment events:** 250
- **Recovery cases:** 250
- **Initial revenue at risk:** ₹12,48,500
- **Initial targeted revenue:** ₹0
- **Initial attempted revenue:** ₹0
- **Initial recovered revenue:** ₹0
- **Initial recovery rate:** 0%

The seeded failure categories are balanced across five categories:

- Gateway timeout
- Temporary bank failure
- Insufficient funds
- Expired payment method
- Authentication failure

The database is intended to begin from a clean `DETECTED` state, after which the actual recovery workflow generates runtime analysis, decisions, actions, and outcomes.

---

## 10. Data Flow

In the intended live architecture:

```text
Merchant
   ↓
Connect Razorpay
   ↓
Razorpay APIs / Webhooks
   ↓
RecoverAI Backend
   ↓
Normalize Event
   ↓
MongoDB
   ↓
Recovery Engine
   ↓
Merchant Dashboard
```

RecoverAI is an intelligence/recovery layer on top of the merchant's payment infrastructure; it is not intended to replace Razorpay as the payment processor.

---

## 11. Razorpay Integration

The application is designed with a dual-mode architecture:

### Simulation Mode

Used for the hackathon demonstration and local development.

### Live/Test Razorpay Mode

Designed to consume Razorpay payment information and webhook events when credentials and a reachable webhook endpoint are configured.

Environment variables:

```env
RAZORPAY_KEY_ID=
RAZORPAY_KEY_SECRET=
RAZORPAY_WEBHOOK_SECRET=
```

Razorpay secret values must only exist on the backend and must never be exposed in frontend code.

The webhook architecture is intended to:

1. Receive the event.
2. Verify its signature.
3. Check idempotency using the event ID.
4. Store/normalize the event.
5. Create or update a recovery case.
6. Trigger the recovery workflow.

---

## 12. Idempotency and State Safety

Webhook events and recovery actions must not be processed multiple times accidentally.

The recovery workflow uses explicit states such as:

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

A recovery case in a terminal state such as `RECOVERED` or `STOPPED` should not be blindly reprocessed.

Similarly, successful recovery must not be counted twice.

---

## 13. Merchant-Facing Product Areas

The planned merchant dashboard includes:

- Dashboard
- Revenue Risk
- Recovery Command Center
- Customers
- Payments
- Agent Activity
- Analytics
- Policies
- Audit Trail
- Settings

Optional extensions can include:

- Checkout Recovery
- Subscriptions
- Promise to Pay
- Hinglish recovery
- Payment degradation detection

These optional capabilities should only be added after the core recovery loop is stable.

---

## 14. Dashboard Concept

The main dashboard should make the merchant immediately understand:

```text
Revenue at Risk
Recoverable Revenue
Revenue Recovered
Recovery Rate
Active Recovery Cases
```

It should additionally show:

- Revenue leakage by root cause
- Recovery performance
- Recent recovery cases
- Agent activity
- Recovery trends

Example conceptual view:

```text
Revenue at Risk       ₹12.43L
Recoverable Revenue    ₹7.79L
Recovered Revenue      ₹4,999
Recovery Rate             100%
Active Cases               249
```

All displayed values should originate from backend APIs and database calculations.

---

## 15. Recovery Case Detail

A recovery case should explain:

- Customer
- Amount at risk
- Risk score
- Recovery probability
- Expected recovery
- Root cause
- AI confidence
- Recommended action
- Why the action was selected
- Evidence
- Policy result
- Action state
- Verification result
- Amount recovered
- Complete timeline

Example lifecycle:

```text
10:31  Payment failed
10:31  Risk detected
10:32  AI diagnosis completed
10:32  Policy approved
10:33  Action scheduled
16:34  Action executed
16:34  Payment verified
16:34  ₹4,999 recovered
16:34  Workflow stopped
```

The UI should show concise decision rationale rather than exposing private chain-of-thought.

---

## 16. Technology Stack

### Frontend

- React
- Vite
- JavaScript
- React Router
- Tailwind CSS
- Recharts
- Lucide React

### Backend

- Node.js
- Express.js
- JavaScript / ES Modules
- Mongoose
- MongoDB Atlas

### AI

- Google Gemini
- `@google/genai`
- Structured JSON output for bounded diagnosis
- Deterministic fallback rules

### Payments

- Razorpay APIs
- Razorpay Webhooks

---

## 17. Project Structure

```text
RecoverAI/
│
├── backend/
│   ├── src/
│   │   ├── config/
│   │   ├── controllers/
│   │   ├── middleware/
│   │   ├── models/
│   │   ├── routes/
│   │   ├── services/
│   │   ├── seed/
│   │   └── utils/
│   ├── server.js
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── layouts/
│   │   ├── pages/
│   │   ├── services/
│   │   └── utils/
│   └── package.json
│
├── .env.example
├── package.json
└── README.md
```

---

## 18. Important Backend Services

Current core services include:

```text
riskEngine.js
aiDiagnosisService.js
diagnosePaymentFailure.js
policyEngine.js
recoveryActionService.js
actionExecutionService.js
verificationService.js
recoveryWorker.js
recoveryOrchestrator.js
metricsService.js
auditService.js
razorpayService.js
simulationService.js
```

The core orchestrator is conceptually:

```text
Detect
  ↓
Risk
  ↓
AI Diagnosis
  ↓
Policy
  ↓
Action
  ↓
Execution
  ↓
Verification
  ↓
Stop
  ↓
Audit
```

---

## 19. API Layer

Current API areas include:

### Dashboard

```text
GET /api/dashboard/summary
GET /api/dashboard/root-causes
GET /api/dashboard/recovery-performance
```

### Recovery

```text
GET  /api/recovery/cases
GET  /api/recovery/cases/:id
POST /api/recovery/cases/:id/analyze
POST /api/recovery/cases/:id/process
```

### Worker

```text
POST /api/recovery/worker/run
```

Additional API areas for customers, payments, policies, audit, agent activity, simulation, authentication, and webhooks are part of the planned application structure.

---

## 20. Environment Variables

Create `backend/.env` from `.env.example`.

Example:

```env
PORT=5000

MONGODB_URI=

JWT_SECRET=

RAZORPAY_KEY_ID=
RAZORPAY_KEY_SECRET=
RAZORPAY_WEBHOOK_SECRET=

AI_API_KEY=
```

Never commit real credentials.

---

## 21. Local Development

### Backend

```bash
cd backend
npm install
npm run dev
```

### Seed demo data

```bash
cd backend
npm run seed
```

The seed command creates the clean Acme SaaS demo state.

### Run frontend

```bash
cd frontend
npm install
npm run dev
```

### Run the full project from the root

The root project is intended to run frontend and backend concurrently using the configured scripts.

---

## 22. Development Verification

Important checks include:

### Risk Engine

Verify risk score, recovery probability, expected recovery, and priority calculations.

### AI Diagnosis

Verify that Gemini returns structured diagnosis data and that deterministic fallback works if AI is unavailable.

### Policy Engine

Verify that merchant rules override unsafe AI recommendations.

Example:

```text
AI says: retry in 1 hour
Merchant policy: minimum retry interval = 6 hours

Final result: retry scheduled no earlier than 6 hours
```

### Recovery Action

Verify that scheduling and execution have distinct states.

### Verification

Verify that executed actions do not become recovered until payment completion is verified.

### Metrics

Verify that actual recovered revenue changes only after successful recovery.

### Audit

Verify that major workflow stages create audit records.

### Webhooks

Verify duplicate webhook events are not processed twice.

---

## 23. Demo Walkthrough

The strongest demo should use a single clear story first.

### Step 1 — Start from the merchant dashboard

Show the baseline:

```text
₹12.48L Revenue at Risk
₹0 Recovered
250 Active Cases
```

### Step 2 — Open the Golden Case

Amit Singh — ₹4,999.

### Step 3 — Run the recovery pipeline

Show:

```text
Risk → AI → Policy → Scheduled Action
```

### Step 4 — Run the recovery worker

The scheduled action is executed in simulation mode.

### Step 5 — Verify recovery

The payment is simulated as successfully captured.

### Step 6 — Show the result

```text
₹4,999 Recovered
1 Recovered Case
249 Active Cases
```

### Step 7 — Open the audit trail

Show the complete decision/action history.

This demonstrates that RecoverAI does not merely identify revenue leakage; it performs and verifies a bounded recovery workflow.

---

## 24. Current Limitations / Future Work

The current build intentionally focuses on the core failed-payment recovery loop.

Future extensions include:

- Full production Razorpay live-mode execution
- Automated public webhook deployment
- Subscription recovery
- Checkout abandonment recovery
- Promise-to-pay tracking
- Hinglish/voice recovery
- Payment degradation detection
- More sophisticated campaign optimization
- Authentication and multi-merchant access controls
- Background scheduling/queue infrastructure for production scale

These should be added without weakening the core safety and audit model.

---

## 25. Buildathon Alignment

### Razorpay AI Buildathon

**Track 03 — AI Revenue Recovery**

RecoverAI aligns with the track through:

- Revenue-risk detection
- Root-cause diagnosis
- Recovery decision-making
- Payment/recovery action execution
- Bounded workflows
- Merchant-defined stopping rules
- Measured recovered money
- Auditability
- Razorpay integration architecture

The central demonstration is:

> **Find revenue that is slipping away and win it back.**

---

## 26. Product Principle

RecoverAI should always prioritize this sequence:

```text
Find the risk
   ↓
Understand the cause
   ↓
Choose the right intervention
   ↓
Check whether it is allowed
   ↓
Execute safely
   ↓
Verify the outcome
   ↓
Measure the money recovered
   ↓
Stop when appropriate
   ↓
Prove what happened
```

If a feature does not meaningfully improve this loop, it should not take priority over making the core recovery workflow reliable and measurable.

---

## License

This project is a hackathon project for the Razorpay AI Buildathon.
