import express from "express";

import {
  getPayment,
  getPayments
} from "../controllers/paymentController.js";

const router = express.Router();

router.get("/", getPayments);

router.get("/:id", getPayment);

export default router;
