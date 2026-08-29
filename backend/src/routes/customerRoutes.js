import express from "express";

import {
  getCustomer,
  getCustomers
} from "../controllers/customerController.js";

const router = express.Router();

router.get("/", getCustomers);

router.get("/:id", getCustomer);

export default router;
