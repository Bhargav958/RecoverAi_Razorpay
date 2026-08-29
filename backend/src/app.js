import express from "express";
import cors from "cors";

import recoveryRoutes from "./routes/recoveryRoutes.js";

import dashboardRoutes from "./routes/dashboardRoutes.js";
 
import workerRoutes from "./routes/workerRoutes.js";

import simulationRoutes from "./routes/simulationRoutes.js";

import policyRoutes from "./routes/policyRoutes.js";

import agentRoutes from "./routes/agentRoutes.js";

import razorpayWebhookRoutes from "./routes/razorpayWebhookRoutes.js";

import webhookRoutes from "./routes/webhookRoutes.js";

import escalationRoutes from "./routes/escalationRoutes.js";

import demoRoutes from "./routes/demoRoutes.js"

const app =
  express();

app.use(
  cors({
    origin:
      "http://localhost:5173",

    credentials: true
  })
);

/*
|--------------------------------------------------------------------------
| Razorpay webhook
|--------------------------------------------------------------------------
|
| Must come BEFORE express.json()
|
|--------------------------------------------------------------------------
*/

app.use(
  "/api/webhooks/razorpay",
  razorpayWebhookRoutes
);


app.use(
  "/api/webhooks",
  webhookRoutes
);

/*
|--------------------------------------------------------------------------
| Normal JSON API
|--------------------------------------------------------------------------
*/

app.use(
  express.json()
);

app.get(
  "/api/health",
  (req, res) => {
    res.json({
      success: true,
      message:
        "RecoverAI backend is running"
    });
  }
);

app.use(
  "/api/dashboard",
  dashboardRoutes
);

app.use(
  "/api/recovery",
  recoveryRoutes
);

app.use(
  "/api/recovery/worker",
  workerRoutes
);

app.use(
  "/api/simulation",
  simulationRoutes
);

app.use(
  "/api/policies",
  policyRoutes
);

app.use(
  "/api/agent",
  agentRoutes
);

app.use(
  "/api/escalations",
  escalationRoutes
);

app.use(
  "/api/demo",
  demoRoutes
);

export default app;