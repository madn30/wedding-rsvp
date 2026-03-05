import { Request, Response, NextFunction } from "express";
import { Guest } from "../models/Guest";
import { Event as EventModel } from "../models/Event";
import { AppError, asyncHandler, generateToken } from "../utils/helpers";
import {
  sendInvite,
  normalizeIsraeliPhone,
} from "../services/messagingService";

export const getGuests = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const { search, response, page = "1", limit = "50" } = req.query;

    const activeEvent = await EventModel.findOne({ isActive: true });
    if (!activeEvent) {
      return next(
        new AppError("Please set an active event to view guests.", 400),
      );
    }

    const filter: Record<string, unknown> = { eventId: activeEvent._id };

    if (response && response !== "all") {
      filter.response = response === "pending" ? null : response;
    }
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: "i" } },
        { phone: { $regex: search, $options: "i" } },
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
      activeEvent: activeEvent.name,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        pages: Math.ceil(total / limitNum),
      },
    });
  },
);

export const createGuest = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const { name, phone } = req.body;

    const activeEvent = await EventModel.findOne({ isActive: true });
    if (!activeEvent) {
      return next(
        new AppError(
          "No active event found. Set an event to active first.",
          400,
        ),
      );
    }

    let normalizedPhone: string;
    try {
      normalizedPhone = normalizeIsraeliPhone(phone);
    } catch {
      return next(new AppError("Invalid Israeli phone number format.", 400));
    }

    try {
      await Guest.collection.dropIndex("phone_1");
    } catch {}

    const existing = await Guest.findOne({
      phone: normalizedPhone,
      eventId: activeEvent._id,
    });

    if (existing) {
      return next(
        new AppError(
          "A guest with this phone number already exists for this wedding.",
          409,
        ),
      );
    }

    const token = generateToken();
    const guest = await Guest.create({
      name,
      phone: normalizedPhone,
      token,
      eventId: activeEvent._id,
    });

    res.status(201).json({ success: true, data: guest });
  },
);

export const deleteGuest = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const activeEvent = await EventModel.findOne({ isActive: true });

    const query = activeEvent
      ? { _id: req.params.id, eventId: activeEvent._id }
      : { _id: req.params.id };

    const guest = await Guest.findOneAndDelete(query);

    if (!guest) {
      return next(
        new AppError(
          "Guest not found or does not belong to the active event.",
          404,
        ),
      );
    }
    res.status(200).json({ success: true, message: "Guest deleted." });
  },
);

export const sendInvitation = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const guest = await Guest.findById(req.params.id);
    if (!guest) {
      return next(new AppError("Guest not found.", 404));
    }

    const activeEvent = await EventModel.findOne({ isActive: true });
    if (!activeEvent) {
      return next(
        new AppError("No active event found to send invitations.", 400),
      );
    }

    const rsvpLink = `${process.env.RSVP_BASE_URL}/rsvp/${guest.token}`;

    await sendInvite({
      to: guest.phone,
      name: guest.name,
      rsvpLink,
      event: activeEvent,
    });

    guest.messageSent = true;
    guest.messageChannel = "whatsapp";
    guest.messageSentAt = new Date();
    await guest.save();

    res.status(200).json({
      success: true,
      message: `WhatsApp invitation for ${activeEvent.name} sent to ${guest.name}.`,
      data: guest,
    });
  },
);

export const exportCSV = asyncHandler(
  async (_req: Request, res: Response, next: NextFunction) => {
    const activeEvent = await EventModel.findOne({ isActive: true });
    if (!activeEvent) {
      return next(new AppError("No active event to export.", 400));
    }

    const guests = await Guest.find({ eventId: activeEvent._id })
      .sort({ createdAt: -1 })
      .lean();

    const responseMap: Record<string, string> = {
      yes: "מגיע",
      no: "לא מגיע",
      maybe: "אולי",
    };

    const headers = [
      "שם",
      "טלפון",
      "תשובה",
      "תאריך תשובה",
      "הודעה נשלחה",
      "ערוץ",
    ];

    const rows = guests.map((g) => [
      g.name,
      g.phone,
      g.response ? responseMap[g.response] : "ממתין",
      g.respondedAt ? new Date(g.respondedAt).toLocaleDateString("he-IL") : "",
      g.messageSent ? "כן" : "לא",
      g.messageChannel || "",
    ]);

    const bom = "\uFEFF";
    const csv = bom + [headers, ...rows].map((row) => row.join(",")).join("\n");

    res.setHeader("Content-Type", "text/csv; charset=utf-8");

    const filename = `guests_${activeEvent.name.replace(/\s+/g, "_")}.csv`;
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    res.send(csv);
  },
);
