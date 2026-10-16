import mongoose, { Schema, Document } from 'mongoose';

export interface ITripItineraryItem {
  id: string;
  day: number;
  date: string;
  activity: string;
  location: string;
  notes?: string;
  isDone: boolean;
}

export interface ITripLocation {
  id: string;
  name: string;
  lat: number;
  lng: number;
  highlight: string;
}

export interface ITripPackingItem {
  id: string;
  item: string;
  isPacked: boolean;
  packedByUserId?: mongoose.Types.ObjectId;
}

export interface ITrip extends Document {
  coupleId: mongoose.Types.ObjectId;
  title: string;
  destination: string;
  startDate: string;
  endDate: string;
  coverUrl: string;
  status: 'planned' | 'ongoing' | 'completed';
  itinerary: ITripItineraryItem[];
  locations: ITripLocation[];
  packingList: ITripPackingItem[];
  memoriesCount: number;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const tripSchema = new Schema<ITrip>(
  {
    coupleId: { type: Schema.Types.ObjectId, ref: 'Couple', required: true, index: true },
    title: { type: String, required: true, trim: true },
    destination: { type: String, required: true },
    startDate: { type: String, required: true },
    endDate: { type: String, required: true },
    coverUrl: { type: String, required: true },
    status: { type: String, enum: ['planned', 'ongoing', 'completed'], default: 'planned' },
    itinerary: [
      {
        id: { type: String, required: true },
        day: { type: Number, required: true },
        date: { type: String, required: true },
        activity: { type: String, required: true },
        location: { type: String, required: true },
        notes: { type: String },
        isDone: { type: Boolean, default: false },
      },
    ],
    locations: [
      {
        id: { type: String, required: true },
        name: { type: String, required: true },
        lat: { type: Number, required: true },
        lng: { type: Number, required: true },
        highlight: { type: String, required: true },
      },
    ],
    packingList: [
      {
        id: { type: String, required: true },
        item: { type: String, required: true },
        isPacked: { type: Boolean, default: false },
        packedByUserId: { type: Schema.Types.ObjectId, ref: 'User' },
      },
    ],
    memoriesCount: { type: Number, default: 0 },
    notes: { type: String },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: (_doc: any, ret: any) => {
        ret.id = ret._id.toString();
        ret.coupleId = ret.coupleId?.toString();
        delete ret._id;
        delete ret.__v;
        return ret;
      },
    },
  }
);

tripSchema.index({ coupleId: 1, startDate: -1 });

export const Trip = mongoose.model<ITrip>('Trip', tripSchema);
