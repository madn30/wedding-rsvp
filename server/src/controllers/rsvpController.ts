import { Request, Response, NextFunction } from "express";
import { Guest } from "../models/Guest";
import { AppSettings } from "../models/AppSettings";
import { Event as EventModel } from "../models/Event";
import { AppError, asyncHandler } from "../utils/helpers";
import { isWhatsAppReady, sendDeclinedReply } from "../whatsapp";

export const getRSVP = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const activeEvent = await EventModel.findOne({ isActive: true });

    if (!activeEvent) {
      return next(new AppError("No active event found.", 404));
    }

    const guest = await Guest.findOne({ token: req.params.token }).select(
      "name response respondedAt numberOfGuests foodPreference transportNeeded specialRequests",
    );

    if (!guest) {
      return next(new AppError("RSVP link is invalid or has expired.", 404));
    }

    const settings = await AppSettings.getSingleton();

    const isExpired =
      new Date() > new Date(activeEvent.date) || settings.rsvpLocked;

    const coupleNames =
      activeEvent.groomName && activeEvent.brideName
        ? `${activeEvent.groomName} & ${activeEvent.brideName}`
        : activeEvent.name;

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

        coupleNames: coupleNames,
        weddingDate: activeEvent.date,
        startTime: activeEvent.startTime,
        venue: activeEvent.location,
        isExpired,
      },
    });
  },
);
export const submitRSVP = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const activeEvent = await EventModel.findOne({ isActive: true });
    const settings = await AppSettings.getSingleton();

    if (
      !activeEvent ||
      new Date() > new Date(activeEvent.date) ||
      settings.rsvpLocked
    ) {
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
