import express from "express";
import cors from "cors";

import recoveryRoutes from "./routes/recoveryRoutes.js";
import dashboardRoutes from "./routes/dashboardRoutes.js"
import workerRoutes from "./routes/workerRoutes.js"

import simulationRoutes from "./routes/simulationRoutes.js";

const app = express();

app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true
  })
);

app.use(express.json());

app.get("/api/health", (req, res) => {
  res.json({
    success: true,
    message: "RecoverAI backend is running"
  });
});

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

export default app;