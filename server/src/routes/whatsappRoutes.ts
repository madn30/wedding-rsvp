import { Router } from 'express';
import { handleIncomingMessage } from '../controllers/whatsappController';

const router = Router();

// Twilio sends a POST request
router.post('/incoming', handleIncomingMessage);

export default router;