import mongoose, { Schema, Document } from 'mongoose';

export type FavoriteResourceType = 'memory' | 'song' | 'message' | 'place' | 'post' | 'quote';

export interface IFavorite extends Document {
  coupleId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  resourceType: FavoriteResourceType;
  resourceId: string;
  createdAt: Date;
}

const favoriteSchema = new Schema<IFavorite>(
  {
    coupleId: { type: Schema.Types.ObjectId, ref: 'Couple', required: true, index: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    resourceType: {
      type: String,
      enum: ['memory', 'song', 'message', 'place', 'post', 'quote'],
      required: true,
    },
    resourceId: { type: String, required: true },
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

// Prevent duplicate favorites for same user + resource
favoriteSchema.index({ coupleId: 1, userId: 1, resourceType: 1, resourceId: 1 }, { unique: true });

export const Favorite = mongoose.model<IFavorite>('Favorite', favoriteSchema);
