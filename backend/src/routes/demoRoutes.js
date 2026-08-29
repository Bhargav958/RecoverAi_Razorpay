import express from "express";

import {
  simulatePaymentFailure
} from "../controllers/demoController.js";

const demoRoutes =
  express.Router();

demoRoutes.post(
  "/payment-failure",
  simulatePaymentFailure
);

export default demoRoutes;