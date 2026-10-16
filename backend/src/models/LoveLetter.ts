import mongoose, { Schema, Document } from 'mongoose';

export type LetterOccasion =
  | "Open when you're missing me"
  | "Open when you're sad"
  | "Open when you need motivation"
  | "Open on our anniversary"
  | "Open on your birthday"
  | "Open when you need a smile"
  | "Open when you can't sleep"
  | "Open on a rainy day"
  | "Open just because";

export interface ILoveLetter extends Document {
  coupleId: mongoose.Types.ObjectId;
  authorId: mongoose.Types.ObjectId;
  authorName: string;
  recipientId: mongoose.Types.ObjectId;
  recipientName: string;
  occasion: LetterOccasion;
  title: string;
  content: string;
  isOpened: boolean;
  openedAt?: string;
  unlockDate?: string;
  photos?: string[];
  audioVoiceNoteUrl?: string;
  waxSealColor: 'monochrome-silver' | 'monochrome-black' | 'monochrome-white' | 'clay-dark';
  createdAt: Date;
  updatedAt: Date;
}

const loveLetterSchema = new Schema<ILoveLetter>(
  {
    coupleId: { type: Schema.Types.ObjectId, ref: 'Couple', required: true, index: true },
    authorId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    authorName: { type: String, required: true },
    recipientId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    recipientName: { type: String, required: true },
    occasion: {
      type: String,
      required: true,
    },
    title: { type: String, required: true, trim: true },
    content: { type: String, required: true },
    isOpened: { type: Boolean, default: false },
    openedAt: { type: String },
    unlockDate: { type: String },
    photos: [{ type: String }],
    audioVoiceNoteUrl: { type: String },
    waxSealColor: {
      type: String,
      enum: ['monochrome-silver', 'monochrome-black', 'monochrome-white', 'clay-dark'],
      default: 'monochrome-black',
    },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: (_doc: any, ret: any) => {
        ret.id = ret._id.toString();
        ret.coupleId = ret.coupleId?.toString();
        ret.authorId = ret.authorId?.toString();
        ret.recipientId = ret.recipientId?.toString();
        delete ret._id;
        delete ret.__v;
        return ret;
      },
    },
  }
);

loveLetterSchema.index({ coupleId: 1, createdAt: -1 });

export const LoveLetter = mongoose.model<ILoveLetter>('LoveLetter', loveLetterSchema);
