import mongoose, { Schema, Document } from 'mongoose';

export type JournalMood = 'romantic' | 'grateful' | 'peaceful' | 'excited' | 'reflective' | 'vulnerable';

export interface IJournalEntry extends Document {
  coupleId: mongoose.Types.ObjectId;
  authorId: mongoose.Types.ObjectId;
  authorName: string;
  date: string;
  title: string;
  content: string;
  mood: JournalMood;
  weather?: string;
  location?: string;
  photos: string[];
  isPrivate: boolean;
  musicTrack?: string;
  isFavorite: boolean;
  partnerRead: boolean;
  reactions: { emoji: string; userId: mongoose.Types.ObjectId }[];
  createdAt: Date;
  updatedAt: Date;
}

const journalSchema = new Schema<IJournalEntry>(
  {
    coupleId: { type: Schema.Types.ObjectId, ref: 'Couple', required: true, index: true },
    authorId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    authorName: { type: String, required: true },
    date: { type: String, required: true },
    title: { type: String, required: true, trim: true },
    content: { type: String, required: true },
    mood: {
      type: String,
      enum: ['romantic', 'grateful', 'peaceful', 'excited', 'reflective', 'vulnerable'],
      default: 'romantic',
    },
    weather: { type: String },
    location: { type: String },
    photos: [{ type: String }],
    isPrivate: { type: Boolean, default: false },
    musicTrack: { type: String },
    isFavorite: { type: Boolean, default: false },
    partnerRead: { type: Boolean, default: false },
    reactions: [
      {
        emoji: { type: String, required: true },
        userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
      },
    ],
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: (_doc: any, ret: any) => {
        ret.id = ret._id.toString();
        ret.coupleId = ret.coupleId?.toString();
        ret.authorId = ret.authorId?.toString();
        delete ret._id;
        delete ret.__v;
        return ret;
      },
    },
  }
);

journalSchema.index({ coupleId: 1, date: -1 });

export const Journal = mongoose.model<IJournalEntry>('Journal', journalSchema);
