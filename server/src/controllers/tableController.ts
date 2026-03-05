import { Request, Response, NextFunction } from "express";
import { Table } from "../models/Table";
import { AppError, asyncHandler } from "../utils/helpers";

const GUEST_PROJ = "name phone response numberOfGuests foodPreference";

export const getTables = asyncHandler(async (_req: Request, res: Response) => {
  const tables = await Table.find()
    .populate("seatedGuests", GUEST_PROJ)
    .sort({ createdAt: 1 })
    .lean();

  res.json({ success: true, data: tables });
});

export const createTable = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const {
      name,
      type = "round",
      capacity = 8,
      x = 10,
      y = 10,
      size = 1,
      rotation = 0,
    } = req.body;

    if (!name?.trim()) return next(new AppError("Table name is required", 400));

    const table = await Table.create({
      name: name.trim(),
      type,
      capacity,
      x,
      y,
      size,
      rotation,
    });

    res.status(201).json({ success: true, data: table });
  },
);

export const updateTable = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const { ...updates } = req.body;

    const table = await Table.findByIdAndUpdate(
      req.params.id,
      { $set: updates },
      { new: true, runValidators: true },
    ).populate("seatedGuests", GUEST_PROJ);

    if (!table) return next(new AppError("Table not found", 404));

    res.json({ success: true, data: table });
  },
);

export const deleteTable = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const table = await Table.findByIdAndDelete(req.params.id);
    if (!table) return next(new AppError("Table not found", 404));

    res.json({ success: true, message: "Table deleted" });
  },
);

export const seatGuest = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const { id: tableId, guestId } = req.params;

    const table = await Table.findById(tableId);
    if (!table) return next(new AppError("Table not found", 404));

    if (table.seatedGuests.length >= table.capacity) {
      return next(new AppError("Table is at full capacity", 400));
    }

    await Table.updateMany(
      { seatedGuests: guestId },
      { $pull: { seatedGuests: guestId } },
    );

    const updated = await Table.findByIdAndUpdate(
      tableId,
      { $addToSet: { seatedGuests: guestId } },
      { new: true },
    ).populate("seatedGuests", GUEST_PROJ);

    res.json({ success: true, data: updated });
  },
);

export const unseatGuest = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const { id: tableId, guestId } = req.params;

    const table = await Table.findByIdAndUpdate(
      tableId,
      { $pull: { seatedGuests: guestId } },
      { new: true },
    ).populate("seatedGuests", GUEST_PROJ);

    if (!table) return next(new AppError("Table not found", 404));

    res.json({ success: true, data: table });
  },
);
