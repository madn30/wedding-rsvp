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
  hasReplied?: boolean; // true = guest already messaged us → free-text allowed
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
  const { to, name, rsvpLink, channel, hasReplied = false } = options;

  const from =
    channel === 'whatsapp'
      ? process.env.TWILIO_WHATSAPP_NUMBER // whatsapp:+972535666298
      : process.env.TWILIO_PHONE_NUMBER;

  const toNumber = channel === 'whatsapp' ? `whatsapp:${to}` : to;

  const messagePayload: Record<string, unknown> = { from, to: toNumber };

  if (channel === 'whatsapp') {
    if (hasReplied) {
      // Guest already messaged us → 24-hour free-text window is open
      messagePayload.body = buildMessage(name, rsvpLink);
    } else {
      // First outbound message → MUST use an approved WhatsApp template
      const templateSid = process.env.TWILIO_WHATSAPP_TEMPLATE_SID;
      if (!templateSid || templateSid.startsWith('HXxxx')) {
        throw new Error(
          'TWILIO_WHATSAPP_TEMPLATE_SID is not set. ' +
          'Create an approved template in Twilio Console and set its ContentSid.'
        );
      }
      messagePayload.contentSid = templateSid;
      messagePayload.contentVariables = JSON.stringify({
        1: name,
        2: rsvpLink,
      });
    }
  } else {
    // SMS — always free text
    messagePayload.body = buildMessage(name, rsvpLink);
  }

  try {
    const message = await client.messages.create(messagePayload as any);
    return message.sid;
  } catch (err: any) {
    // Surface actionable Twilio error codes
    const code: number = err.code;
    if (code === 63016) {
      throw new Error('WhatsApp: template not approved or ContentSid is wrong.');
    }
    if (code === 63032 || code === 63003) {
      throw new Error('WhatsApp: recipient has not opted-in or number is blocked.');
    }
    if (code === 21211) {
      throw new Error(`WhatsApp: invalid "to" number format: ${toNumber}`);
    }
    throw err; // re-throw unknown errors
  }
};

export const normalizeIsraeliPhone = (phone: string): string => {
  // Strip everything except digits
  const digits = phone.replace(/\D/g, '');

  if (digits.startsWith('972') && digits.length === 12) return `+${digits}`;
  if (digits.startsWith('05') && digits.length === 10) return `+972${digits.slice(1)}`;
  if (digits.startsWith('5') && digits.length === 9) return `+972${digits}`;

  throw new Error(`Invalid Israeli phone number: ${phone}`);
};
