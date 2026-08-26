import express from "express";

import {
  analyzeCase,
  getRecoveryCase
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

export default router;