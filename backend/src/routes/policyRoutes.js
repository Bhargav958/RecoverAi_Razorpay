import express from "express";

import {
  getMerchantPolicy,
  updateMerchantPolicy
} from "../controllers/policyController.js";

const router =
  express.Router();

router.get(
  "/",
  getMerchantPolicy
);

router.put(
  "/",
  updateMerchantPolicy
);

export default router;
