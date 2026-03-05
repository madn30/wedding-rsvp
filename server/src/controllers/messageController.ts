import { Request, Response } from "express";
import {
  isWhatsAppReady,
  sendWhatsAppMessage,
  randomDelay,
  formatToWhatsAppId,
} from "../whatsapp";
import { normalizeIsraeliPhone, sendInvite } from "../services/messagingService"; // 👈 Import sendInvite
import { Guest } from "../models/Guest";
import { Event as EventModel } from "../models/Event";

export const sendInvitationMessage = async (
  req: Request,
  res: Response,
): Promise<void> => {
  const { phoneNumber, messageContent, guestId } = req.body as {
    phoneNumber?: string;
    messageContent?: string;
    guestId?: string;
  };

  const activeEvent = await EventModel.findOne({ isActive: true });
  if (!activeEvent) {
    res.status(400).json({
      success: false,
      message: "No active event found. Please set an event to active before sending invitations.",
    });
    return;
  }

  if (!isWhatsAppReady()) {
    res.status(503).json({
      success: false,
      message: "WhatsApp client is not ready. Please scan the QR code in the terminal.",
    });
    return;
  }

  // ✨ SMART AUTO-GENERATE: If no message text was sent, but we have a guest ID, build the template!
  if (!messageContent && guestId) {
    const guest = await Guest.findById(guestId);
    if (!guest) {
      res.status(404).json({ success: false, message: "Guest not found." });
      return;
    }

    const rsvpLink = `${process.env.RSVP_BASE_URL}/rsvp/${guest.token}`;

    try {
      await sendInvite({
        to: guest.phone,
        name: guest.name,
        rsvpLink,
        event: activeEvent,
      });

      guest.messageSent = true;
      guest.messageChannel = "whatsapp";
      guest.messageSentAt = new Date();
      guest.eventId = activeEvent._id; 
      await guest.save();

      res.status(200).json({
        success: true,
        message: `WhatsApp invitation auto-generated and sent to ${guest.name}.`,
        data: guest,
      });
      return; // Stop execution here since we sent the message
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
      return;
    }
  }

  // ─── ORIGINAL LOGIC FOR CUSTOM MESSAGES ───
  if (!phoneNumber || !messageContent) {
    res.status(400).json({
      success: false,
      message: "phoneNumber and messageContent are required for custom messages.",
    });
    return;
  }

  let normalizedPhone: string;
  try {
    normalizedPhone = normalizeIsraeliPhone(phoneNumber);
  } catch {
    res.status(400).json({
      success: false,
      message: `Invalid phone number: "${phoneNumber}".`,
    });
    return;
  }

  await randomDelay();

  try {
    await sendWhatsAppMessage(normalizedPhone, messageContent);

    if (guestId) {
      await Guest.findByIdAndUpdate(guestId, {
        $set: {
          eventId: activeEvent._id,
          messageSent: true,
          messageChannel: "whatsapp",
          messageSentAt: new Date(),
        },
      });
    }

    res.status(200).json({
      success: true,
      message: `WhatsApp custom message sent for ${activeEvent.name}.`,
      data: {
        whatsappId: formatToWhatsAppId(normalizedPhone),
        eventName: activeEvent.name,
      },
    });
  } catch (err: any) {
    const status = err.message?.includes("not registered on WhatsApp")
      ? 422
      : 500;
    res.status(status).json({
      success: false,
      message: err.message || "Failed to send WhatsApp message.",
    });
  }
};