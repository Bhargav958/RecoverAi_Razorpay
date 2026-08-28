import express from "express";

import {
  getMerchantPolicy
} from "../controllers/policyController.js";

const router =
  express.Router();

router.get(
  "/",
  getMerchantPolicy
);

export default router;