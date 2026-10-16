import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IReel extends Document {
  coupleId: Types.ObjectId;
  createdBy: Types.ObjectId;
  createdByName: string;
  platform: 'instagram' | 'facebook';
  sourceUrl: string;
  shortcode?: string;
  title?: string;
  caption?: string;
  category: string;
  isFavorite: boolean;
  savedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const reelSchema = new Schema<IReel>(
  {
    coupleId: { type: Schema.Types.ObjectId, ref: 'Couple', required: true, index: true },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    createdByName: { type: String, default: 'Desh' },
    platform: { type: String, enum: ['instagram', 'facebook'], default: 'instagram', required: true },
    sourceUrl: { type: String, required: true, trim: true },
    shortcode: { type: String, trim: true },
    title: { type: String, default: '', trim: true },
    caption: { type: String, default: '', trim: true },
    category: { type: String, default: 'romantic', trim: true, index: true },
    isFavorite: { type: Boolean, default: false, index: true },
    savedAt: { type: Date, default: Date.now, index: true },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: (_doc: any, ret: any) => {
        ret.id = ret._id.toString();
        ret.coupleId = ret.coupleId?.toString();
        ret.createdBy = ret.createdBy?.toString();
        ret.url = ret.sourceUrl;
        delete ret._id;
        delete ret.__v;
        return ret;
      },
    },
  }
);

// Prevent duplicate URLs in the same couple gallery
reelSchema.index({ coupleId: 1, sourceUrl: 1 });
reelSchema.index({ coupleId: 1, shortcode: 1 });
reelSchema.index({ coupleId: 1, savedAt: -1 });

export const Reel = mongoose.model<IReel>('Reel', reelSchema);
