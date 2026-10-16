import mongoose, { Schema, Document } from 'mongoose';

export interface IMilestone extends Document {
  coupleId: mongoose.Types.ObjectId;
  date: string;
  title: string;
  description: string;
  location?: string;
  photos: string[];
  category: 'firsts' | 'trips' | 'anniversaries' | 'life' | 'commitments';
  song?: {
    title: string;
    artist: string;
  };
  highlightQuote?: string;
  createdAt: Date;
  updatedAt: Date;
}

const milestoneSchema = new Schema<IMilestone>(
  {
    coupleId: { type: Schema.Types.ObjectId, ref: 'Couple', required: true, index: true },
    date: { type: String, required: true },
    title: { type: String, required: true, trim: true },
    description: { type: String, default: '' },
    location: { type: String },
    photos: [{ type: String }],
    category: {
      type: String,
      enum: ['firsts', 'trips', 'anniversaries', 'life', 'commitments'],
      default: 'firsts',
    },
    song: {
      title: { type: String },
      artist: { type: String },
    },
    highlightQuote: { type: String },
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

milestoneSchema.index({ coupleId: 1, date: 1 });

export const Milestone = mongoose.model<IMilestone>('Milestone', milestoneSchema);
