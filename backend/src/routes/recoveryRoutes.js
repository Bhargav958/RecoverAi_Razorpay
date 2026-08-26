import express from "express";

import {
  analyzeCase,
  getRecoveryCase,
  processCase
} from "../controllers/recoveryController.js";

const router = express.Router();

router.get(
  "/cases/:id",
  getRecoveryCase
);

router.post(
  "/cases/:id/analyze",
  analyzeCase
);

router.post(
  "/cases/:id/process",
  processCase
);

export default router;