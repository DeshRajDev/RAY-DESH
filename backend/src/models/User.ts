import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IUser extends Document {
  name: string;
  nickname: string;
  email: string;
  phoneNumber?: string;
  passwordHash: string;
  avatar: string;
  bio: string;
  birthday: string;
  favoriteSong?: string;
  favoritePlace?: string;
  favoriteQuote?: string;
  favoriteColor?: string;
  statusMessage?: string;
  isOnline: boolean;
  lastSeen?: string;
  role: 'partner1' | 'partner2';
  coupleId?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new Schema<IUser>(
  {
    name: { type: String, required: true, trim: true },
    nickname: { type: String, default: '', trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
    phoneNumber: { type: String, trim: true, index: true },
    passwordHash: { type: String, required: true },
    avatar: { type: String, default: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80' },
    bio: { type: String, default: '', trim: true },
    birthday: { type: String, required: true },
    favoriteSong: { type: String, default: '' },
    favoritePlace: { type: String, default: '' },
    favoriteQuote: { type: String, default: '' },
    favoriteColor: { type: String, default: '#171717' },
    statusMessage: { type: String, default: '' },
    isOnline: { type: Boolean, default: false },
    lastSeen: { type: String, default: 'Recently active' },
    role: { type: String, enum: ['partner1', 'partner2'], required: true },
    coupleId: { type: Schema.Types.ObjectId, ref: 'Couple', index: true },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: (_doc: any, ret: any) => {
        ret.id = ret._id.toString();
        delete ret._id;
        delete ret.__v;
        delete ret.passwordHash;
        return ret;
      },
    },
  }
);

export const User = mongoose.model<IUser>('User', userSchema);
