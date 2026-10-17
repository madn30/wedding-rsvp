import { Router } from "express";
import { sendInvitationMessage } from "../controllers/messageController";

const router = Router();

router.post("/send-invitation", sendInvitationMessage);

export default router;
