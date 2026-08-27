import express from "express";

import {
  analyzeCase,
  getRecoveryCase,
  processCase,
  getRecoveryCases
} from "../controllers/recoveryController.js";

const router = express.Router();

/*
|--------------------------------------------------------------------------
| Recovery Case List
|--------------------------------------------------------------------------
*/

router.get(
  "/cases",
  getRecoveryCases
);

/*
|--------------------------------------------------------------------------
| Recovery Case Detail
|--------------------------------------------------------------------------
*/

router.get(
  "/cases/:id",
  getRecoveryCase
);

/*
|--------------------------------------------------------------------------
| Analyze
|--------------------------------------------------------------------------
*/

router.post(
  "/cases/:id/analyze",
  analyzeCase
);

/*
|--------------------------------------------------------------------------
| Full Recovery Pipeline
|--------------------------------------------------------------------------
*/

router.post(
  "/cases/:id/process",
  processCase
);

export default router;