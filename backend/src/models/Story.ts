import mongoose, { Schema, Document } from 'mongoose';

export interface IStoryReply {
  userId: mongoose.Types.ObjectId;
  text: string;
  createdAt: string;
}

export interface IStory extends Document {
  coupleId: mongoose.Types.ObjectId;
  authorId: mongoose.Types.ObjectId;
  type: 'image' | 'video' | 'text' | 'music';
  mediaUrl?: string;
  text?: string;
  backgroundColor?: string;
  songTitle?: string;
  songArtist?: string;
  caption?: string;
  durationSeconds?: number;
  textOverlays?: {
    text: string;
    xPercent: number;
    yPercent: number;
    color?: string;
    fontSize?: number;
    background?: string;
  }[];
  expiresAt: Date;
  reactions: { emoji: string; userId: mongoose.Types.ObjectId }[];
  replies: IStoryReply[];
  isArchived: boolean;
  createdAt: Date;
}

const storySchema = new Schema<IStory>(
  {
    coupleId: { type: Schema.Types.ObjectId, ref: 'Couple', required: true, index: true },
    authorId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    type: { type: String, enum: ['image', 'video', 'text', 'music'], default: 'image' },
    mediaUrl: { type: String },
    text: { type: String },
    backgroundColor: { type: String, default: '#111111' },
    songTitle: { type: String },
    songArtist: { type: String },
    caption: { type: String },
    durationSeconds: { type: Number, default: 15, min: 15, max: 45 },
    textOverlays: [
      {
        text: { type: String, required: true },
        xPercent: { type: Number, default: 50 },
        yPercent: { type: Number, default: 50 },
        color: { type: String, default: '#FFFFFF' },
        fontSize: { type: Number, default: 18 },
        background: { type: String, default: 'rgba(0,0,0,0.5)' },
      },
    ],
    expiresAt: {
      type: Date,
      default: () => new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
      index: true,
    },
    reactions: [
      {
        emoji: { type: String, required: true },
        userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
      },
    ],
    replies: [
      {
        userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
        text: { type: String, required: true },
        createdAt: { type: String, default: () => new Date().toISOString() },
      },
    ],
    isArchived: { type: Boolean, default: false },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: (_doc: any, ret: any) => {
        ret.id = ret._id.toString();
        ret.authorId = ret.authorId?.toString();
        ret.coupleId = ret.coupleId?.toString();
        delete ret._id;
        delete ret.__v;
        return ret;
      },
    },
  }
);

storySchema.index({ coupleId: 1, expiresAt: 1, isArchived: 1 });

export const Story = mongoose.model<IStory>('Story', storySchema);
