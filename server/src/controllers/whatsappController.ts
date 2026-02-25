import { Request, Response } from 'express';
import twilio from 'twilio';

const MessagingResponse = twilio.twiml.MessagingResponse;

// ... (your other existing exports in this file)

export const handleIncomingMessage = async (req: Request, res: Response) => {
  try {
    const incomingMsg = req.body.Body; // What the guest replied
    const fromNumber = req.body.From; // The guest's phone number
    
    const twiml = new MessagingResponse();
    
    // An auto-reply telling them to use the link
    twiml.message('תודה על הודעתך! אנא הכנס ללינק שנשלח אליך קודם כדי לאשר או לעדכן את הגעתך לחתונה. 💍');

    // Twilio requires an XML content type for webhooks
    res.set('Content-Type', 'text/xml');
    res.status(200).send(twiml.toString());
  } catch (error) {
    console.error('Error handling incoming WhatsApp message:', error);
    res.status(500).send('Server Error');
  }
};