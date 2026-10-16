import mongoose, { Schema, Document } from 'mongoose';

export type BucketListCategory = 'Travel' | 'Adventure' | 'Food' | 'Romantic' | 'Milestone' | 'Future' | 'Creative';
export type BucketListPriority = 'low' | 'medium' | 'high' | 'dream';

export interface IBucketListItem extends Document {
  coupleId: mongoose.Types.ObjectId;
  title: string;
  description?: string;
  category: BucketListCategory;
  priority: BucketListPriority;
  isCompleted: boolean;
  dateAdded: string;
  completedDate?: string;
  location?: string;
  photos?: string[];
  notes?: string;
  addedById: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const bucketListSchema = new Schema<IBucketListItem>(
  {
    coupleId: { type: Schema.Types.ObjectId, ref: 'Couple', required: true, index: true },
    title: { type: String, required: true, trim: true },
    description: { type: String, default: '' },
    category: {
      type: String,
      enum: ['Travel', 'Adventure', 'Food', 'Romantic', 'Milestone', 'Future', 'Creative'],
      default: 'Travel',
    },
    priority: { type: String, enum: ['low', 'medium', 'high', 'dream'], default: 'medium' },
    isCompleted: { type: Boolean, default: false, index: true },
    dateAdded: { type: String, default: () => new Date().toISOString() },
    completedDate: { type: String },
    location: { type: String },
    photos: [{ type: String }],
    notes: { type: String },
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

bucketListSchema.index({ coupleId: 1, isCompleted: 1 });

export const BucketList = mongoose.model<IBucketListItem>('BucketList', bucketListSchema);
