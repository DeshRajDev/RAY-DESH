import mongoose, { Schema, Document } from 'mongoose';

export interface IPostComment {
  userId: mongoose.Types.ObjectId;
  userName: string;
  userAvatar: string;
  text: string;
  createdAt: string;
}

export interface IPost extends Document {
  coupleId: mongoose.Types.ObjectId;
  authorId: mongoose.Types.ObjectId;
  caption: string;
  mediaUrls: string[];
  songTitle?: string;
  songArtist?: string;
  location?: string;
  tags: string[];
  likes: { userId: mongoose.Types.ObjectId; emoji: string }[];
  comments: IPostComment[];
  isPinned: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const postSchema = new Schema<IPost>(
  {
    coupleId: { type: Schema.Types.ObjectId, ref: 'Couple', required: true, index: true },
    authorId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    caption: { type: String, required: true },
    mediaUrls: [{ type: String }],
    songTitle: { type: String },
    songArtist: { type: String },
    location: { type: String },
    tags: [{ type: String }],
    likes: [
      {
        userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
        emoji: { type: String, default: '❤️' },
      },
    ],
    comments: [
      {
        userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
        userName: { type: String, required: true },
        userAvatar: { type: String, default: '' },
        text: { type: String, required: true },
        createdAt: { type: String, default: () => new Date().toISOString() },
      },
    ],
    isPinned: { type: Boolean, default: false },
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

postSchema.index({ coupleId: 1, createdAt: -1 });

export const Post = mongoose.model<IPost>('Post', postSchema);
