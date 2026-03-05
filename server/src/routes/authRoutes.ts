import { Router } from "express";
import { login, getMe } from "../controllers/authController";
import { protect } from "../middlewares/auth";
import { validate } from "../middlewares/validate";
import { adminLoginSchema } from "../utils/validators";

const router = Router();

router.post("/login", validate(adminLoginSchema), login);
router.get("/me", protect, getMe);

export default router;
