import mongoose, { Schema, Document } from 'mongoose';

export type PlaceCategory = 'been' | 'want_to_go';

export interface IPlace extends Document {
  coupleId: mongoose.Types.ObjectId;
  name: string;
  category: PlaceCategory;
  country: string;
  city?: string;
  coordinates?: {
    lat: number;
    lng: number;
  };
  visitedDate?: string;
  rating?: number;
  notes?: string;
  photos: string[];
  isFavorite: boolean;
  addedById: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const placeSchema = new Schema<IPlace>(
  {
    coupleId: { type: Schema.Types.ObjectId, ref: 'Couple', required: true, index: true },
    name: { type: String, required: true, trim: true },
    category: { type: String, enum: ['been', 'want_to_go'], default: 'been' },
    country: { type: String, required: true },
    city: { type: String },
    coordinates: {
      lat: { type: Number },
      lng: { type: Number },
    },
    visitedDate: { type: String },
    rating: { type: Number, min: 1, max: 5 },
    notes: { type: String },
    photos: [{ type: String }],
    isFavorite: { type: Boolean, default: false, index: true },
    addedById: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: (_doc: any, ret: any) => {
        ret.id = ret._id.toString();
        ret.coupleId = ret.coupleId?.toString();
        ret.addedById = ret.addedById?.toString();
        delete ret._id;
        delete ret.__v;
        return ret;
      },
    },
  }
);

placeSchema.index({ coupleId: 1, category: 1 });

export const Place = mongoose.model<IPlace>('Place', placeSchema);
