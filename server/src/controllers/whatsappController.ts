import { Request, Response } from 'express';
import twilio from 'twilio';
import { Guest } from '../models/Guest';

const MessagingResponse = twilio.twiml.MessagingResponse;

export const handleIncomingMessage = async (req: Request, res: Response) => {
  // Always respond with valid TwiML — Twilio retries on non-200
  const twiml = new MessagingResponse();

  try {
    const incomingMsg: string = (req.body.Body || '').trim();
    const fromRaw: string = req.body.From || ''; // e.g. "whatsapp:+972501234567"

    if (!fromRaw) {
      twiml.message('לא הצלחנו לזהות את המספר שלך.');
      res.set('Content-Type', 'text/xml');
      return res.status(200).send(twiml.toString());
    }

    // Normalize: strip "whatsapp:" prefix
    const normalizedPhone = fromRaw.replace(/^whatsapp:/, '');

    // Mark guest as having replied → unlocks free-text window for future sends
    await Guest.findOneAndUpdate(
      { phone: normalizedPhone },
      { $set: { whatsappReplied: true } }
    );

    // Auto-reply directing them to the RSVP link
    twiml.message(
      'תודה על הודעתך! אנא הכנס ללינק שנשלח אליך קודם כדי לאשר או לעדכן את הגעתך לחתונה. 💍'
    );
  } catch (error) {
    console.error('Error handling incoming WhatsApp message:', error);
    // Still return empty 200 — never let Twilio retry on a DB error
  }

  res.set('Content-Type', 'text/xml');
  res.status(200).send(twiml.toString());
};
