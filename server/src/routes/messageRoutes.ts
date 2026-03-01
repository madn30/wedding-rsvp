/**
 * messageRoutes.ts
 * Mounted at /api/messages in server.ts
 */

import { Router } from 'express';
import { sendInvitationMessage } from '../controllers/messageController';
import { protect } from '../middlewares/auth';

const router = Router();

// POST /api/messages/send-invitation
// Body: { phoneNumber: string, messageContent: string, guestId?: string }
router.post('/send-invitation', protect, sendInvitationMessage);

export default router;
