import mongoose, { Document, Schema } from 'mongoose';

export interface IEvent extends Document {
  name: string;
  groomName?: string;
  brideName?: string; 
  date: string;
  startTime: string;
  location: string;
  description: string;
  isActive: boolean;
}

const EventSchema = new Schema<IEvent>(
  {
    name:        { type: String, required: true, trim: true, minlength: 2, maxlength: 200 },
    groomName:   { type: String, trim: true, default: '' }, 
    brideName:   { type: String, trim: true, default: '' },
    date:        { type: String, required: true },
    startTime:   { type: String, required: true },
    location:    { type: String, default: '' },
    description: { type: String, default: '', maxlength: 500 },
    isActive:    { type: Boolean, default: false },
  },
  { timestamps: true }
);

export const Event = mongoose.model<IEvent>('Event', EventSchema);
