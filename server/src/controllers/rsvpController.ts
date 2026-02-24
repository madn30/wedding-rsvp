import { Request, Response, NextFunction } from 'express';
import { Guest } from '../models/Guest';
import { AppError, asyncHandler } from '../utils/helpers';

// GET /api/rsvp/:token
export const getRSVP = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const guest = await Guest.findOne({ token: req.params.token }).select(
      'name response respondedAt numberOfGuests foodPreference transportNeeded specialRequests'
    );
    if (!guest) {
      return next(new AppError('RSVP link is invalid or has expired.', 404));
    }

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
        coupleNames: process.env.COUPLE_NAMES || 'החתן והכלה',
        weddingDate: process.env.WEDDING_DATE || '',
        venue: process.env.WEDDING_VENUE || '',
      },
    });
  }
);

// POST /api/rsvp/:token
// Re-submissions are allowed — guests can update their response at any time.
export const submitRSVP = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const {
      response,
      numberOfGuests,
      foodPreference,
      transportNeeded,
      specialRequests,
    } = req.body;

    const guest = await Guest.findOne({ token: req.params.token });
    if (!guest) {
      return next(new AppError('RSVP link is invalid or has expired.', 404));
    }

    guest.response = response;
    guest.respondedAt = new Date();

    // Only persist guest-count details when attending
    if (response === 'yes' || response === 'maybe') {
      if (numberOfGuests !== undefined) guest.numberOfGuests = numberOfGuests;
      if (foodPreference !== undefined) guest.foodPreference = foodPreference ?? null;
      if (transportNeeded !== undefined) guest.transportNeeded = transportNeeded;
      if (specialRequests !== undefined) guest.specialRequests = specialRequests ?? '';
    } else {
      // "no" — reset attendance details
      guest.numberOfGuests = 0;
      guest.foodPreference = null;
      guest.transportNeeded = false;
      guest.specialRequests = '';
    }

    await guest.save();

    res.status(200).json({
      success: true,
      message: 'RSVP submitted successfully.',
      data: {
        name: guest.name,
        response: guest.response,
        numberOfGuests: guest.numberOfGuests,
      },
    });
  }
);
