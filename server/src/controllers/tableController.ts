import { Request, Response, NextFunction } from 'express';
import { Table } from '../models/Table';
import { AppError, asyncHandler } from '../utils/helpers';

// Fields projected when returning populated seatedGuests
const GUEST_PROJ = 'name phone response numberOfGuests foodPreference';

// ─── GET /api/tables ────────────────────────────────────────────────────────
export const getTables = asyncHandler(async (_req: Request, res: Response) => {
  const tables = await Table.find()
    .populate('seatedGuests', GUEST_PROJ)
    .sort({ createdAt: 1 })
    .lean();

  res.json({ success: true, data: tables });
});

// ─── POST /api/tables ───────────────────────────────────────────────────────
export const createTable = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const {
      name,
      type = 'round',
      capacity = 8,
      x = 10,
      y = 10,
      size = 1,
      rotation = 0,
    } = req.body;

    if (!name?.trim()) return next(new AppError('Table name is required', 400));

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
  }
);

// ─── PUT /api/tables/:id ────────────────────────────────────────────────────
export const updateTable = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    // Prevent callers from overwriting the seatedGuests array via this endpoint
    const { seatedGuests: _ignored, ...updates } = req.body;

    const table = await Table.findByIdAndUpdate(
      req.params.id,
      { $set: updates },
      { new: true, runValidators: true }
    ).populate('seatedGuests', GUEST_PROJ);

    if (!table) return next(new AppError('Table not found', 404));

    res.json({ success: true, data: table });
  }
);

// ─── DELETE /api/tables/:id ─────────────────────────────────────────────────
export const deleteTable = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const table = await Table.findByIdAndDelete(req.params.id);
    if (!table) return next(new AppError('Table not found', 404));

    res.json({ success: true, message: 'Table deleted' });
  }
);

// ─── POST /api/tables/:id/seat/:guestId ─────────────────────────────────────
export const seatGuest = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const { id: tableId, guestId } = req.params;

    const table = await Table.findById(tableId);
    if (!table) return next(new AppError('Table not found', 404));

    if (table.seatedGuests.length >= table.capacity) {
      return next(new AppError('Table is at full capacity', 400));
    }

    // Atomically remove the guest from every other table, then add to this one
    await Table.updateMany(
      { seatedGuests: guestId },
      { $pull: { seatedGuests: guestId } }
    );

    const updated = await Table.findByIdAndUpdate(
      tableId,
      { $addToSet: { seatedGuests: guestId } },
      { new: true }
    ).populate('seatedGuests', GUEST_PROJ);

    res.json({ success: true, data: updated });
  }
);

// ─── DELETE /api/tables/:id/seat/:guestId ───────────────────────────────────
export const unseatGuest = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const { id: tableId, guestId } = req.params;

    const table = await Table.findByIdAndUpdate(
      tableId,
      { $pull: { seatedGuests: guestId } },
      { new: true }
    ).populate('seatedGuests', GUEST_PROJ);

    if (!table) return next(new AppError('Table not found', 404));

    res.json({ success: true, data: table });
  }
);
