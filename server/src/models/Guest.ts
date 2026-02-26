import mongoose, { Document, Schema } from 'mongoose';

export type RSVPResponse = 'yes' | 'no' | 'maybe' | null;
export type MessageChannel = 'sms' | 'whatsapp';
export type FoodPreference = 'regular' | 'vegetarian' | 'vegan' | 'gluten-free' | null;

export interface IGuest extends Document {
  name: string;
  phone: string;
  token: string;
  response: RSVPResponse;
  respondedAt: Date | null;
  numberOfGuests: number;
  foodPreference: FoodPreference;
  transportNeeded: boolean;
  specialRequests: string;
  messageSent: boolean;
  messageChannel: MessageChannel | null;
  messageSentAt: Date | null;
  whatsappReplied: boolean;  // true once guest has sent us at least one WhatsApp message
  createdAt: Date;
  updatedAt: Date;
}

const GuestSchema = new Schema<IGuest>(
  {
    name: {
      type: String,
      required: [true, 'Guest name is required'],
      trim: true,
      minlength: [2, 'Name must be at least 2 characters'],
      maxlength: [100, 'Name cannot exceed 100 characters'],
    },
    phone: {
      type: String,
      required: [true, 'Phone number is required'],
      unique: true,
      validate: {
        validator: (v: string) => /^\+9725\d{8}$/.test(v),
        message: 'Phone must be a valid Israeli number in +972 format',
      },
    },
    token: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    response: {
      type: String,
      enum: ['yes', 'no', 'maybe', null],
      default: null,
    },
    respondedAt: {
      type: Date,
      default: null,
    },
    numberOfGuests: {
      type: Number,
      default: 1,
      min: [0, 'numberOfGuests cannot be negative'],
      max: [20, 'numberOfGuests cannot exceed 20'],
    },
    foodPreference: {
      type: String,
      enum: ['regular', 'vegetarian', 'vegan', 'gluten-free', null],
      default: null,
    },
    transportNeeded: {
      type: Boolean,
      default: false,
    },
    specialRequests: {
      type: String,
      trim: true,
      maxlength: [500, 'Special requests cannot exceed 500 characters'],
      default: '',
    },
    messageSent: {
      type: Boolean,
      default: false,
    },
    messageChannel: {
      type: String,
      enum: ['sms', 'whatsapp', null],
      default: null,
    },
    messageSentAt: {
      type: Date,
      default: null,
    },
    whatsappReplied: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

GuestSchema.index({ response: 1 });
GuestSchema.index({ createdAt: -1 });

export const Guest = mongoose.model<IGuest>('Guest', GuestSchema);
