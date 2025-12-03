import express from "express";
import { shelterLogin } from "../controllers/shelterAuthController.js";

const router = express.Router();

router.post("/login", shelterLogin);

export default router;
