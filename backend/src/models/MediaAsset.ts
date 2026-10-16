import mongoose, { Schema, Document } from 'mongoose';

export interface IMediaAsset extends Document {
  coupleId: mongoose.Types.ObjectId;
  ownerId: mongoose.Types.ObjectId;
  storageKey: string;
  url: string;
  mediaType: 'image' | 'video' | 'audio' | 'document';
  mimeType: string;
  sizeBytes: number;
  width?: number;
  height?: number;
  duration?: number;
  createdAt: Date;
}

const mediaAssetSchema = new Schema<IMediaAsset>(
  {
    coupleId: { type: Schema.Types.ObjectId, ref: 'Couple', required: true, index: true },
    ownerId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    storageKey: { type: String, required: true },
    url: { type: String, required: true },
    mediaType: { type: String, enum: ['image', 'video', 'audio', 'document'], required: true },
    mimeType: { type: String, required: true },
    sizeBytes: { type: Number, required: true },
    width: { type: Number },
    height: { type: Number },
    duration: { type: Number },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: (_doc: any, ret: any) => {
        ret.id = ret._id.toString();
        delete ret._id;
        delete ret.__v;
        return ret;
      },
    },
  }
);

export const MediaAsset = mongoose.model<IMediaAsset>('MediaAsset', mediaAssetSchema);
