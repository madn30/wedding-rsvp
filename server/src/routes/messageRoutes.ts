import { Router } from "express";
import { sendInvitationMessage } from "../controllers/messageController";
import { protect } from "../middlewares/auth";

const router = Router();

router.post("/send-invitation", protect, sendInvitationMessage);

export default router;
