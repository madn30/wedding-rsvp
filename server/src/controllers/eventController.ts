import { Request, Response } from 'express';
import { Event } from '../models/Event';

export const getEvents = async (_req: Request, res: Response): Promise<void> => {
  try {
    const events = await Event.find().sort({ createdAt: -1 });
    res.json({ success: true, data: events });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const createEvent = async (req: Request, res: Response): Promise<void> => {
  try {
    const event = await Event.create(req.body);
    res.status(201).json({ success: true, data: event });
  } catch (err: any) {
    res.status(400).json({ success: false, message: err.message });
  }
};

export const updateEvent = async (req: Request, res: Response): Promise<void> => {
  try {
    const event = await Event.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!event) {
      res.status(404).json({ success: false, message: 'Event not found.' });
      return;
    }
    res.json({ success: true, data: event });
  } catch (err: any) {
    res.status(400).json({ success: false, message: err.message });
  }
};

export const deleteEvent = async (req: Request, res: Response): Promise<void> => {
  try {
    const event = await Event.findByIdAndDelete(req.params.id);
    if (!event) {
      res.status(404).json({ success: false, message: 'Event not found.' });
      return;
    }
    res.json({ success: true, message: 'Event deleted successfully.' });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const setActiveEvent = async (req: Request, res: Response): Promise<void> => {
  try {
    await Event.updateMany({}, { isActive: false });
    const event = await Event.findByIdAndUpdate(
      req.params.id,
      { isActive: true },
      { new: true }
    );
    if (!event) {
      res.status(404).json({ success: false, message: 'Event not found.' });
      return;
    }
    res.json({ success: true, data: event });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const clearActiveEvent = async (_req: Request, res: Response): Promise<void> => {
  try {
    await Event.updateMany({}, { isActive: false });
    res.json({ success: true, message: 'Active event cleared.' });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};
