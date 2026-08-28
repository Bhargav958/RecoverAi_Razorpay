import express from "express";

import {
  approveEscalatedCase,
  rejectEscalatedCase
} from "../controllers/escalationController.js";

const router =
  express.Router();

router.post(
  "/:id/approve",
  approveEscalatedCase
);

router.post(
  "/:id/reject",
  rejectEscalatedCase
);

export default router;