import express from "express";
import cors from "cors";

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

app.get("/api/db-test", (req, res) => {
  res.json({
    success: true,
    message: "Database layer is ready"
  });
});

export default app;