import { Request, Response } from "express";
import { Guest } from "../models/Guest";
import { asyncHandler } from "../utils/helpers";

export const getStats = asyncHandler(async (_req: Request, res: Response) => {
  const [total, yes, no, maybe, messageSent, guestCountAgg] = await Promise.all(
    [
      Guest.countDocuments(),
      Guest.countDocuments({ response: "yes" }),
      Guest.countDocuments({ response: "no" }),
      Guest.countDocuments({ response: "maybe" }),
      Guest.countDocuments({ messageSent: true }),

      Guest.aggregate([
        { $match: { response: "yes" } },
        { $group: { _id: null, total: { $sum: "$numberOfGuests" } } },
      ]),
    ],
  );

  const pending = total - yes - no - maybe;
  const responseRate =
    total > 0 ? Math.round(((yes + no + maybe) / total) * 100) : 0;
  const totalConfirmedGuests: number =
    guestCountAgg.length > 0 ? (guestCountAgg[0].total as number) : 0;

  res.status(200).json({
    success: true,
    data: {
      total,
      yes,
      no,
      maybe,
      pending,
      messageSent,
      responseRate,
      totalConfirmedGuests,
    },
  });
});
