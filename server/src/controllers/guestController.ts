import { Request, Response, NextFunction } from 'express';
import { Guest } from '../models/Guest';
import { AppError, asyncHandler, generateToken } from '../utils/helpers';
import {
  sendSMS,
  normalizeIsraeliPhone,
  MessageChannel,
} from '../services/twilioService';

// GET /api/guests
export const getGuests = asyncHandler(
  async (req: Request, res: Response) => {
    const { search, response, page = '1', limit = '50' } = req.query;

    const filter: Record<string, unknown> = {};
    if (response && response !== 'all') {
      filter.response = response === 'pending' ? null : response;
    }
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } },
      ];
    }

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    const [guests, total] = await Promise.all([
      Guest.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .lean(),
      Guest.countDocuments(filter),
    ]);

    res.status(200).json({
      success: true,
      data: guests,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        pages: Math.ceil(total / limitNum),
      },
    });
  }
);

// POST /api/guests
export const createGuest = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const { name, phone } = req.body;

    let normalizedPhone: string;
    try {
      normalizedPhone = normalizeIsraeliPhone(phone);
    } catch {
      return next(new AppError('Invalid Israeli phone number format.', 400));
    }

    const existing = await Guest.findOne({ phone: normalizedPhone });
    if (existing) {
      return next(new AppError('A guest with this phone number already exists.', 409));
    }

    const token = generateToken();
    const guest = await Guest.create({
      name,
      phone: normalizedPhone,
      token,
    });

    res.status(201).json({ success: true, data: guest });
  }
);

// DELETE /api/guests/:id
export const deleteGuest = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const guest = await Guest.findByIdAndDelete(req.params.id);
    if (!guest) {
      return next(new AppError('Guest not found.', 404));
    }
    res.status(200).json({ success: true, message: 'Guest deleted.' });
  }
);

// POST /api/guests/:id/send
export const sendInvitation = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const { channel } = req.body as { channel: MessageChannel };

    const guest = await Guest.findById(req.params.id);
    if (!guest) {
      return next(new AppError('Guest not found.', 404));
    }

    const rsvpLink = `${process.env.RSVP_BASE_URL}/rsvp/${guest.token}`;

    await sendSMS({
      to: guest.phone,
      name: guest.name,
      rsvpLink,
      channel,
      hasReplied: channel === 'whatsapp' ? guest.whatsappReplied : undefined,
    });

    guest.messageSent = true;
    guest.messageChannel = channel;
    guest.messageSentAt = new Date();
    await guest.save();

    res.status(200).json({
      success: true,
      message: `Invitation sent via ${channel} to ${guest.name}.`,
      data: guest,
    });
  }
);

// GET /api/guests/export
export const exportCSV = asyncHandler(async (_req: Request, res: Response) => {
  const guests = await Guest.find().sort({ createdAt: -1 }).lean();

  const responseMap: Record<string, string> = {
    yes: 'מגיע',
    no: 'לא מגיע',
    maybe: 'אולי',
  };

  const headers = ['שם', 'טלפון', 'תשובה', 'תאריך תשובה', 'הודעה נשלחה', 'ערוץ'];
  const rows = guests.map((g) => [
    g.name,
    g.phone,
    g.response ? responseMap[g.response] : 'ממתין',
    g.respondedAt ? new Date(g.respondedAt).toLocaleDateString('he-IL') : '',
    g.messageSent ? 'כן' : 'לא',
    g.messageChannel || '',
  ]);

  const bom = '\uFEFF';
  const csv = bom + [headers, ...rows].map((row) => row.join(',')).join('\n');

  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', 'attachment; filename="guests.csv"');
  res.send(csv);
});
