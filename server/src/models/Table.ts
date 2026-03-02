import mongoose, { Document, Schema } from 'mongoose';

export type TableType = 'round' | 'rect' | 'square' | 'oval' | 'dj' | 'dance' | 'bar' | 'stage';

export interface ITable extends Document {
  name: string;
  type: TableType;
  /** Horizontal position as a percentage (0–100) of the canvas width */
  x: number;
  /** Vertical position as a percentage (0–100) of the canvas height */
  y: number;
  capacity: number;
  rotation: number;
  size: number;
  seatedGuests: mongoose.Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
}

const tableSchema = new Schema<ITable>(
  {
    name: {
      type: String,
      required: [true, 'Table name is required'],
      trim: true,
      maxlength: [50, 'Table name cannot exceed 50 characters'],
    },
    type: {
      type: String,
      enum: ['round', 'rect', 'square', 'oval', 'dj', 'dance', 'bar', 'stage'],
      default: 'round',
    },
    x: { type: Number, default: 10, min: 0, max: 100 },
    y: { type: Number, default: 10, min: 0, max: 100 },
    capacity: { type: Number, default: 8, min: 0, max: 200 },
    rotation: { type: Number, default: 0 },
    size: { type: Number, default: 1, min: 0.5, max: 2.5 },
    seatedGuests: [{ type: Schema.Types.ObjectId, ref: 'Guest' }],
  },
  { timestamps: true }
);

export const Table = mongoose.model<ITable>('Table', tableSchema);
