import { Request, Response } from 'express';
import { asyncHandler } from '../utils/helpers';
import { Guest } from '../models/Guest';
const MessagingResponse = require('twilio').twiml.MessagingResponse;

// POST /api/v1/whatsapp/incoming
export const handleIncomingWhatsApp = asyncHandler(
  async (req: Request, res: Response) => {
    const twiml = new MessagingResponse();
    const { Body, From, ProfileName } = req.body;
    
    // ניקוי המספר כדי לחפש ב-DB (הסרת הקידומת whatsapp:)
    const phoneNumber = From.replace('whatsapp:', '');

    console.log(`הודעה התקבלה מ-${ProfileName} (${phoneNumber}): ${Body}`);

    // חיפוש האורח בבסיס הנתונים לפי מספר טלפון
    const guest = await Guest.findOne({ phone: phoneNumber });

    if (!guest) {
      twiml.message(`היי ${ProfileName}, תודה ששלחת הודעה! לא מצאנו את המספר שלך ברשימת המוזמנים. אנא צור קשר עם החתן או הכלה.`);
    } else {
      // כאן אפשר להוסיף לוגיקה חכמה - למשל אם הוא כתב "אישור"
      if (Body.toLowerCase().includes('אישור') || Body.toLowerCase().includes('כן')) {
        twiml.message(`היי ${guest.name}! שמחנו לקבל את האישור שלך. נתראה בחתונה! 🎉`);
      } else {
        twiml.message(`היי ${guest.name}, קיבלנו את ההודעה שלך: "${Body}". האם תרצה לאשר הגעה?`);
      }
    }

    // שליחת ה-TwiML חזרה ל-Twilio
    res.set('Content-Type', 'text/xml');
    res.status(200).send(twiml.toString());
  }
);