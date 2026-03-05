import { Router } from "express";
import { getStats } from "../controllers/statsController";
import { protect } from "../middlewares/auth";

const router = Router();
router.get("/", protect, getStats);

export default router;
