import mongoose, { Schema, Document } from 'mongoose';

export interface IMediaAsset extends Document {
  coupleId: mongoose.Types.ObjectId;
  ownerId: mongoose.Types.ObjectId;
  ownerRole?: 'partner1' | 'partner2';
  storageKey: string;
  url: string;
  thumbnailUrl?: string;
  mediaType: 'image' | 'video' | 'audio' | 'document';
  mimeType: string;
  sizeBytes: number;
  width?: number;
  height?: number;
  duration?: number;
  title?: string;
  caption?: string;
  description?: string;
  tags: string[];
  categories: string[];
  originalFilename?: string;
  storageProvider: 'cloudinary' | 'local' | 's3';
  isFavorite: boolean;
  isPublished: boolean;
  displayOrder: number;
  takenAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const mediaAssetSchema = new Schema<IMediaAsset>(
  {
    coupleId: { type: Schema.Types.ObjectId, ref: 'Couple', required: true, index: true },
    ownerId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    ownerRole: { type: String, enum: ['partner1', 'partner2'] },
    storageKey: { type: String, required: true },
    url: { type: String, required: true },
    thumbnailUrl: { type: String },
    mediaType: { type: String, enum: ['image', 'video', 'audio', 'document'], required: true, index: true },
    mimeType: { type: String, required: true },
    sizeBytes: { type: Number, required: true },
    width: { type: Number },
    height: { type: Number },
    duration: { type: Number },
    title: { type: String, default: '', trim: true },
    caption: { type: String, default: '', trim: true },
    description: { type: String, default: '', trim: true },
    tags: [{ type: String, trim: true, lowercase: true }],
    categories: [{ type: String, trim: true, lowercase: true, index: true }],
    originalFilename: { type: String, trim: true },
    storageProvider: { type: String, enum: ['cloudinary', 'local', 's3'], default: 'local' },
    isFavorite: { type: Boolean, default: false, index: true },
    isPublished: { type: Boolean, default: true, index: true },
    displayOrder: { type: Number, default: 0 },
    takenAt: { type: Date },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: (_doc: any, ret: any) => {
        ret.id = ret._id.toString();
        ret.coupleId = ret.coupleId?.toString();
        ret.ownerId = ret.ownerId?.toString();
        delete ret._id;
        delete ret.__v;
        return ret;
      },
    },
  }
);

// High performance query indexes
mediaAssetSchema.index({ coupleId: 1, categories: 1, createdAt: -1 });
mediaAssetSchema.index({ coupleId: 1, isFavorite: 1, createdAt: -1 });
mediaAssetSchema.index({ coupleId: 1, mediaType: 1, createdAt: -1 });
mediaAssetSchema.index({ coupleId: 1, tags: 1 });

export const MediaAsset = mongoose.model<IMediaAsset>('MediaAsset', mediaAssetSchema);
