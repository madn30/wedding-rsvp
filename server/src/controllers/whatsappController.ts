import { Request, Response } from 'express';

export const handleIncomingMessage = (req: Request, res: Response) => {
  // This is the "Magic" line that will show your code in Render logs
  console.log('--- Incoming WhatsApp/SMS Data ---');
  console.log(req.body); 
  console.log('Message Body:', req.body.Body);
  console.log('----------------------------------');

  // Twilio needs a valid TwiML response, even if empty
  res.type('text/xml');
  res.send('<Response></Response>');
};