import express from "express";

import {
  runRecoveryWorker
} from "../controllers/workerController.js";

const router =
  express.Router();

router.post(
  "/run",
  runRecoveryWorker
);

export default router;