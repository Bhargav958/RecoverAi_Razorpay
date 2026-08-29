import express from "express";

import {
  runBatchSimulation,
  runScenarioSimulation
} from "../controllers/simulationController.js";

const router =
  express.Router();

router.post(
  "/run",
  runBatchSimulation
);

router.post(
  "/scenario",
  runScenarioSimulation
);

export default router;
