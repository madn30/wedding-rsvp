import { Request, Response, NextFunction } from "express";
import { Guest } from "../models/Guest";
import { AppSettings } from "../models/AppSettings";
import { AppError, asyncHandler } from "../utils/helpers";
import { isWhatsAppReady, sendDeclinedReply } from "../whatsapp";

const WEDDING_DATE = new Date("2026-02-10T00:00:00.000+02:00");

export const getRSVP = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const guest = await Guest.findOne({ token: req.params.token }).select(
      "name response respondedAt numberOfGuests foodPreference transportNeeded specialRequests",
    );
    if (!guest) {
      return next(new AppError("RSVP link is invalid or has expired.", 404));
    }

    const settings = await AppSettings.getSingleton();
    const isExpired = new Date() > WEDDING_DATE || settings.rsvpLocked;

    res.status(200).json({
      success: true,
      data: {
        name: guest.name,
        response: guest.response,
        respondedAt: guest.respondedAt,
        numberOfGuests: guest.numberOfGuests,
        foodPreference: guest.foodPreference,
        transportNeeded: guest.transportNeeded,
        specialRequests: guest.specialRequests,
        coupleNames: process.env.COUPLE_NAMES || "החתן והכלה",
        weddingDate: process.env.WEDDING_DATE || "",
        venue: process.env.WEDDING_VENUE || "",
        isExpired,
      },
    });
  },
);

export const submitRSVP = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const settings = await AppSettings.getSingleton();
    if (new Date() > WEDDING_DATE || settings.rsvpLocked) {
      return next(
        new AppError("The event is over and RSVP updates are closed.", 403),
      );
    }

    const {
      response,
      numberOfGuests,
      foodPreference,
      transportNeeded,
      specialRequests,
    } = req.body;

    const guest = await Guest.findOne({ token: req.params.token });
    if (!guest) {
      return next(new AppError("RSVP link is invalid or has expired.", 404));
    }

    const previousResponse = guest.response;
    guest.response = response;
    guest.respondedAt = new Date();

    if (response === "yes" || response === "maybe") {
      if (numberOfGuests !== undefined) guest.numberOfGuests = numberOfGuests;
      if (foodPreference !== undefined)
        guest.foodPreference = foodPreference ?? null;
      if (transportNeeded !== undefined)
        guest.transportNeeded = transportNeeded;
      if (specialRequests !== undefined)
        guest.specialRequests = specialRequests ?? "";
    } else {
      guest.numberOfGuests = 0;
      guest.foodPreference = null;
      guest.transportNeeded = false;
      guest.specialRequests = "";
    }

    await guest.save();

    if (response === "no" && previousResponse !== "no" && isWhatsAppReady()) {
      const { declinedReply } = settings.templates;
      sendDeclinedReply(guest.phone, guest.name, declinedReply).catch(() => {});
    }

    res.status(200).json({
      success: true,
      message: "RSVP submitted successfully.",
      data: {
        name: guest.name,
        response: guest.response,
        numberOfGuests: guest.numberOfGuests,
      },
    });
  },
);
