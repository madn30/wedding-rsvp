/**
 * whatsappRoutes.ts
 * ──────────────────────────────────────────────────────────────────────────────
 * Routes mounted at /api/whatsapp
 *
 * The old Twilio /webhook route has been removed — incoming messages are now
 * handled via the whatsapp-web.js `message` event in utils/whatsapp.ts.
 */

import { Router } from 'express';
import { getStatus } from '../controllers/whatsappController';
import { protect } from '../middlewares/auth';

const router = Router();

// GET /api/whatsapp/status
// Returns whether the WhatsApp client is connected and ready to send.
// Useful for the admin UI to show a connection badge before bulk-sending.
router.get('/status', protect, getStatus);

export default router;
