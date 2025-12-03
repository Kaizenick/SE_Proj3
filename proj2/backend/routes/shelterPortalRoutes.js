import express from "express";
import {
  loginShelter,
  getShelterProfile,
  updateShelterProfile,
  getDashboardStats,
  getPendingOrders,
  acceptOrder,
  rejectOrder,
  getDonationHistory
} from "../controllers/shelterPortalController.js";

import { shelterAuth } from "../middleware/shelterAuth.js";

const router = express.Router();

// Public
router.post("/login", loginShelter);

// Private
router.get("/me", shelterAuth, getShelterProfile);
router.put("/profile", shelterAuth, updateShelterProfile);

router.get("/dashboard-stats", shelterAuth, getDashboardStats);
router.get("/pending-orders", shelterAuth, getPendingOrders);
router.get("/donations", shelterAuth, getDonationHistory);

router.post("/orders/:id/accept", shelterAuth, acceptOrder);
router.post("/orders/:id/reject", shelterAuth, rejectOrder);

export default router;
