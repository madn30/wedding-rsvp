import { Request, Response } from "express";
import {
  isWhatsAppReady,
  sendWhatsAppMessage,
  randomDelay,
  formatToWhatsAppId,
  buildCalendarLink,
} from "../whatsapp";
import { normalizeIsraeliPhone } from "../services/messagingService";
import { Guest } from "../models/Guest";
import { AppSettings } from "../models/AppSettings";
import { Event as EventModel } from "../models/Event";

function interpolate(
  template: string,
  vars: Record<string, string | undefined>,
): string {
  return template.replace(
    /\{\{(\w+)\}\}/g,
    (_, key) => vars[key] ?? `{{${key}}}`,
  );
}

export const sendInvitationMessage = async (
  req: Request,
  res: Response,
): Promise<void> => {
  const { guestId } = req.body as { guestId?: string };

  if (!guestId) {
    res.status(400).json({ success: false, message: "guestId is required." });
    return;
  }

  if (!isWhatsAppReady()) {
    const statusMessage =
      process.env.WHATSAPP_ENABLED === "true"
        ? "WhatsApp is starting or needs QR scan. Check server logs."
        : "WhatsApp is disabled in .env settings.";

    res.status(503).json({ success: false, message: statusMessage });
    return;
  }

  const guest = await Guest.findById(guestId);
  if (!guest) {
    res.status(404).json({ success: false, message: "Guest not found." });
    return;
  }

  const activeEvent = await EventModel.findOne({ isActive: true });

  const settings = await AppSettings.getSingleton();

  const baseUrl = req.headers.origin || `${req.protocol}://${req.get("host")}`;
  const rsvpLink = `${baseUrl}/rsvp/${guest.token}`;
  const coupleNames =
    activeEvent?.groomName && activeEvent?.brideName
      ? `${activeEvent.brideName} ו${activeEvent.groomName}`
      : activeEvent?.name || "החתן והכלה";

  const messageContent = interpolate(settings.templates.invitation, {
    guest_name: guest.name,
    couple_names: coupleNames,
    wedding_date: activeEvent?.date || "טרם נקבע תאריך",
    venue: activeEvent?.location || "טרם נקבע מיקום",
    rsvp_link: rsvpLink,
    calendar_link: buildCalendarLink(activeEvent),
  });

  let normalizedPhone: string;
  try {
    normalizedPhone = normalizeIsraeliPhone(guest.phone);
  } catch {
    res.status(400).json({
      success: false,
      message: `Invalid phone number: "${guest.phone}". Expected format: 0501234567`,
    });
    return;
  }

  await randomDelay();

  try {
    await sendWhatsAppMessage(normalizedPhone, messageContent);

    await Guest.findByIdAndUpdate(guestId, {
      $set: {
        messageSent: true,
        messageChannel: "whatsapp",
        messageSentAt: new Date(),
      },
    });

    res.status(200).json({
      success: true,
      message: `WhatsApp message sent to ${normalizedPhone}.`,
      data: { whatsappId: formatToWhatsAppId(normalizedPhone) },
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
