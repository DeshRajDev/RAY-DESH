import mongoose, { Schema, Document } from 'mongoose';

export interface ISong extends Document {
  coupleId: mongoose.Types.ObjectId;
  title: string;
  artist: string;
  album?: string;
  coverUrl: string;
  audioUrl?: string;
  duration: number; // in seconds
  spotifyUrl?: string;
  addedById: mongoose.Types.ObjectId;
  addedByName?: string;
  category?: string;
  lyricsSnippet?: string;
  note?: string;
  isFavorite: boolean;
  playCount: number;
  createdAt: Date;
  updatedAt: Date;
}

const songSchema = new Schema<ISong>(
  {
    coupleId: { type: Schema.Types.ObjectId, ref: 'Couple', required: true, index: true },
    title: { type: String, required: true, trim: true },
    artist: { type: String, required: true, trim: true },
    album: { type: String, default: '' },
    coverUrl: { type: String, required: true },
    audioUrl: { type: String },
    duration: { type: Number, default: 180 },
    spotifyUrl: { type: String },
    addedById: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    addedByName: { type: String },
    category: { type: String, default: 'Our Songs' },
    lyricsSnippet: { type: String },
    note: { type: String },
    isFavorite: { type: Boolean, default: false, index: true },
    playCount: { type: Number, default: 0 },
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

songSchema.index({ coupleId: 1, createdAt: -1 });

export const Song = mongoose.model<ISong>('Song', songSchema);
