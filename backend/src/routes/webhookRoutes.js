import express from "express";

import {
  getWebhookStatus
} from "../controllers/webhookController.js";

const router =
  express.Router();

router.get(
  "/status",
  getWebhookStatus
);

export default router;