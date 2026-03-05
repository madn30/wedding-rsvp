import { Router } from "express";
import rateLimit from "express-rate-limit";
import { getRSVP, submitRSVP } from "../controllers/rsvpController";
import { validate } from "../middlewares/validate";
import { rsvpResponseSchema } from "../utils/validators";

const router = Router();

const rsvpLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: {
    success: false,
    message: "Too many requests. Please try again later.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

router.get("/:token", getRSVP);
router.post("/:token", rsvpLimiter, validate(rsvpResponseSchema), submitRSVP);

export default router;
