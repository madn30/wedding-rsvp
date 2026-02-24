import twilio from 'twilio';

const client = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

export type MessageChannel = 'sms' | 'whatsapp';

interface SendMessageOptions {
  to: string;
  name: string;
  rsvpLink: string;
  channel: MessageChannel;
}

const buildMessage = (name: string, rsvpLink: string): string => {
  const coupleNames = process.env.COUPLE_NAMES || 'החתן והכלה';
  const weddingDate = process.env.WEDDING_DATE || '';
  const dateText = weddingDate ? ` בתאריך ${weddingDate}` : '';
  return (
    `שלום ${name}! 💍\n` +
    `נשמח לראותך בחתונה של ${coupleNames}${dateText}.\n` +
    `אנא אשר הגעתך בלינק:\n${rsvpLink}`
  );
};

export const sendSMS = async (options: SendMessageOptions): Promise<string> => {
  const { to, name, rsvpLink, channel } = options;
  const body = buildMessage(name, rsvpLink);

  // For WhatsApp: set TWILIO_WHATSAPP_NUMBER to your approved production sender
  // (e.g. whatsapp:+972XXXXXXXXX). The sandbox number is the Twilio default fallback.
  const from =
    channel === 'whatsapp'
      ? process.env.TWILIO_WHATSAPP_NUMBER
      : process.env.TWILIO_PHONE_NUMBER;

  const toNumber = channel === 'whatsapp' ? `whatsapp:${to}` : to;

  const message = await client.messages.create({ body, from, to: toNumber });
  return message.sid;
};

export const normalizeIsraeliPhone = (phone: string): string => {
  const digits = phone.replace(/\D/g, '');

  if (digits.startsWith('972')) return `+${digits}`;
  if (digits.startsWith('05')) return `+972${digits.slice(1)}`;
  if (digits.startsWith('5') && digits.length === 9) return `+972${digits}`;

  throw new Error(`Invalid Israeli phone number: ${phone}`);
};
