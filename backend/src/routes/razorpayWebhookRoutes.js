import express from "express";

import {
  handleRazorpayWebhook
} from "../controllers/razorpayWebhookController.js";

const router =
  express.Router();

/*
|--------------------------------------------------------------------------
| Razorpay webhook
|--------------------------------------------------------------------------
|
| IMPORTANT:
| Use raw body for signature verification.
|
|--------------------------------------------------------------------------
*/

router.post(
  "/",
  express.raw({
    type: "application/json"
  }),
  handleRazorpayWebhook
);

export default router;