import { sendWhatsAppMessage, randomDelay } from "../whatsapp";
import { IEvent } from "../models/Event";

export type MessageChannel = "whatsapp";

export interface SendInviteOptions {
  to: string;
  name: string;
  rsvpLink: string;
  event: IEvent;
}

const buildInviteMessage = (
  name: string,
  rsvpLink: string,
  event: IEvent,
): string => {
  const coupleNames =
    event.groomName && event.brideName
      ? `${event.groomName} & ${event.brideName}`
      : event.name;

  const weddingDate = event.date;
  const dateText = weddingDate ? ` בתאריך ${weddingDate}` : "";

  return (
    `היי ${name}, אנחנו מזמינים אתכם לחתונה של ${coupleNames}${dateText}!\n` +
    `אנא אשרו הגעה כאן:\n${rsvpLink}`
  );
};

export const sendInvite = async (options: SendInviteOptions): Promise<void> => {
  const { to, name, rsvpLink, event } = options;
  const message = buildInviteMessage(name, rsvpLink, event);
  await randomDelay();
  await sendWhatsAppMessage(to, message);
};

export const normalizeIsraeliPhone = (phone: string): string => {
  const digits = phone.replace(/\D/g, "");

  if (digits.startsWith("972") && digits.length === 12) return `+${digits}`;
  if (digits.startsWith("05") && digits.length === 10)
    return `+972${digits.slice(1)}`;
  if (digits.startsWith("5") && digits.length === 9) return `+972${digits}`;

  throw new Error(`Invalid Israeli phone number: ${phone}`);
};
