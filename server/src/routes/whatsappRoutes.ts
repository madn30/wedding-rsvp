import { Router, Request, Response, NextFunction } from 'express';
import twilio from 'twilio';
import { handleIncomingMessage } from '../controllers/whatsappController';

const router = Router();

/**
 * Validate that the request genuinely came from Twilio.
 * Skipped in development/test so you can test locally without a tunnel.
 * In production on Render, `app.set('trust proxy', 1)` must be set (see server.ts).
 */
const validateTwilioSignature = (req: Request, res: Response, next: NextFunction) => {
  if (process.env.NODE_ENV !== 'production') return next();

  const authToken = process.env.TWILIO_AUTH_TOKEN!;
  const signature = req.headers['x-twilio-signature'] as string | undefined;

  if (!signature) {
    return res.status(403).send('Forbidden: missing Twilio signature');
  }

  // req.protocol + host + originalUrl reconstructs the exact URL Twilio signed
  const url = `${req.protocol}://${req.get('host')}${req.originalUrl}`;

  const isValid = twilio.validateRequest(authToken, signature, url, req.body);

  if (!isValid) {
    console.warn('Invalid Twilio signature from', req.ip);
    return res.status(403).send('Forbidden: invalid Twilio signature');
  }

  next();
};

// POST /api/whatsapp/webhook
router.post('/webhook', validateTwilioSignature, handleIncomingMessage);

export default router;
