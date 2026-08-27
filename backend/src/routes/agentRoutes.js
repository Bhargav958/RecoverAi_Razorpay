import express from "express";

import {
  getAgentActivity
} from "../controllers/agentController.js";

const router = express.Router();

router.get(
  "/activity",
  getAgentActivity
);

export default router;