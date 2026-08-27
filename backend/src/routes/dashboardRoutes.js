import express from "express";

import {
  getDashboardSummary,
  getRootCauses,
  getRecoveryPerformance
} from "../controllers/dashboardController.js";

const router = express.Router();

router.get(
  "/summary",
  getDashboardSummary
);

router.get(
  "/root-causes",
  getRootCauses
);

router.get(
  "/recovery-performance",
  getRecoveryPerformance
);

export default router;