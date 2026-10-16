import mongoose, { Schema, Document } from 'mongoose';

export type MemoryCategory = 'All' | 'Photos' | 'Videos' | 'Screenshots' | 'Trips' | 'Dates' | 'Birthdays' | 'Special Moments';

export interface IMemory extends Document {
  coupleId: mongoose.Types.ObjectId;
  title: string;
  description: string;
  date: string;
  location?: string;
  category: MemoryCategory;
  mediaUrls: string[];
  coverUrl: string;
  tags: string[];
  isFavorite: boolean;
  addedById: mongoose.Types.ObjectId;
  likes: number;
  commentsCount: number;
  createdAt: Date;
  updatedAt: Date;
}

const memorySchema = new Schema<IMemory>(
  {
    coupleId: { type: Schema.Types.ObjectId, ref: 'Couple', required: true, index: true },
    title: { type: String, required: true, trim: true },
    description: { type: String, default: '' },
    date: { type: String, required: true },
    location: { type: String, default: '' },
    category: {
      type: String,
      enum: ['All', 'Photos', 'Videos', 'Screenshots', 'Trips', 'Dates', 'Birthdays', 'Special Moments'],
      default: 'Photos',
    },
    mediaUrls: [{ type: String }],
    coverUrl: { type: String, required: true },
    tags: [{ type: String }],
    isFavorite: { type: Boolean, default: false, index: true },
    addedById: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    likes: { type: Number, default: 0 },
    commentsCount: { type: Number, default: 0 },
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

memorySchema.index({ coupleId: 1, date: -1 });

export const Memory = mongoose.model<IMemory>('Memory', memorySchema);
