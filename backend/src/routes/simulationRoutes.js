import express from "express";

import {
  runBatchSimulation
} from "../controllers/simulationController.js";

const router =
  express.Router();

router.post(
  "/run",
  runBatchSimulation
);

export default router;