import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IBirthdayPlan {
  id: string;
  forUserId?: Types.ObjectId;
  title: string;
  category: 'Gift Idea' | 'Trip Idea' | 'Surprise' | 'Activity' | 'Message/Card';
  status: 'idea' | 'planned' | 'purchased' | 'done';
  budget?: string;
  secret: boolean;
  notes?: string;
  addedById: Types.ObjectId;
}

export interface IBirthdayGiftWish {
  id: string;
  forUserId: Types.ObjectId;
  title: string;
  description: string;
  price?: string;
  linkUrl?: string;
  photoUrl?: string;
  videoUrl?: string;
  isClaimed: boolean;
}

export interface IBirthdayData extends Document {
  coupleId: Types.ObjectId;
  plans: IBirthdayPlan[];
  wishes: IBirthdayGiftWish[];
  specialMessageForPartner: string;
  specialMessageFromPartner: string;
  updatedAt: Date;
}

const birthdaySchema = new Schema<IBirthdayData>(
  {
    coupleId: { type: Schema.Types.ObjectId, ref: 'Couple', required: true, unique: true, index: true },
    plans: [
      {
        id: { type: String, required: true },
        forUserId: { type: Schema.Types.ObjectId, ref: 'User' },
        title: { type: String, required: true },
        category: { type: String, enum: ['Gift Idea', 'Trip Idea', 'Surprise', 'Activity', 'Message/Card'], default: 'Gift Idea' },
        status: { type: String, enum: ['idea', 'planned', 'purchased', 'done'], default: 'idea' },
        budget: { type: String },
        secret: { type: Boolean, default: true },
        notes: { type: String },
        addedById: { type: Schema.Types.ObjectId, ref: 'User', required: true },
      },
    ],
    wishes: [
      {
        id: { type: String, required: true },
        forUserId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
        title: { type: String, required: true },
        description: { type: String, default: '' },
        price: { type: String },
        linkUrl: { type: String },
        photoUrl: { type: String },
        videoUrl: { type: String },
        isClaimed: { type: Boolean, default: false },
      },
    ],
    specialMessageForPartner: { type: String, default: '' },
    specialMessageFromPartner: { type: String, default: '' },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: (_doc: any, ret: any) => {
        ret.id = ret._id.toString();
        ret.coupleId = ret.coupleId?.toString();
        delete ret._id;
        delete ret.__v;
        return ret;
      },
    },
  }
);

export const Birthday = mongoose.model<IBirthdayData>('Birthday', birthdaySchema);
