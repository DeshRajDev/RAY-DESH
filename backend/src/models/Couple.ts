import mongoose, { Schema, Document, Types } from 'mongoose';

export interface ICouple extends Document {
  partner1: Types.ObjectId;
  partner2: Types.ObjectId;
  anniversaryDate: string;
  relationshipStartDate: string;
  theme: 'dark' | 'light' | 'system';
  customTitle: string;
  coupleAvatar?: string;
  soundEnabled: boolean;
  privacyPinEnabled: boolean;
  privacyPinHash?: string;
  inviteCode?: string;
  createdAt: Date;
  updatedAt: Date;
}

const coupleSchema = new Schema<ICouple>(
  {
    partner1: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    partner2: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    anniversaryDate: { type: String, required: true, default: '2026-09-27T00:00:00.000Z' },
    relationshipStartDate: { type: String, required: true, default: '2026-09-27T00:00:00.000Z' },
    theme: { type: String, enum: ['dark', 'light', 'system'], default: 'dark' },
    customTitle: { type: String, default: 'Desh & Rey — Our Sanctuary' },
    coupleAvatar: { type: String, default: 'https://images.unsplash.com/photo-1522673607200-164d1b6ce486?w=600&auto=format&fit=crop&q=80' },
    soundEnabled: { type: Boolean, default: true },
    privacyPinEnabled: { type: Boolean, default: false },
    privacyPinHash: { type: String },
    inviteCode: { type: String, unique: true, sparse: true },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: (_doc: any, ret: any) => {
        ret.id = ret._id.toString();
        delete ret._id;
        delete ret.__v;
        delete ret.privacyPinHash;
        return ret;
      },
    },
  }
);

export const Couple = mongoose.model<ICouple>('Couple', coupleSchema);
